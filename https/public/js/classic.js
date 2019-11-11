$(document).ready(async function() {
    let socket = io.connect(socketString);
    let currentIndex = 0;
    let score = 0;
    let lives = 6;
    let streak = 0;
    let actors = [];
    let movies = [];
    let movieIds = [];
    let correct = '';
    let ref = {};
    let sid = '';

    await $.getScript( "js/helpers.js");

    socket.on('game', function(data) {
        log('sid received', data, false);
        sid = data;
    });

    let fillStarters = async () => {
		socket.emit('starters');
		return new Promise((res, rej) => {
			socket.on('starters', async (data) => {
                movies = data.movies;
                actors = data.actors;
                movies.forEach(movie => {
                    movieIds.push(movie.altId);
                });
                shuffle(movieIds);
                res();
			});
			socket.on('err', () => {
				rej();
			});
		});
	}

    let loadMovie = async (id, initial) => {
        loaderOn();
        let movie = movies.find(movie => movie.altId == id);
        let url = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movie.poster}`;

        await setPosterAndTitle(url, movie.title, movie.year);
        loaderOff();

        ref.movie = movie.title + ' (' + movie.year + ')';
        let cast = await getCast(id);
        let details = await getMovie(id);

        $('#overview').text(details.overview);

        let names = [];
        cast.forEach(c => {
            names.push(c.name);
        });
        let index = Math.floor(Math.random() * 3);
        let actor = names[index];
        correct = actor;
        let list = [];
        list.push(actor);
        shuffle(actors);
        actors.forEach(a => {
            if ((list.length < 4) && (!names.includes(a.name))) {
                list.push(a.name);
            }
        });
        shuffle(list);
        $('.button').each(function(index) {
            $(this).text(list[index]);
        });

        if (!initial) startTimer();
    }

    let setPosterAndTitle = async (url, title, year) => {
        log('setPosterAndTitle', `${url} ${title} ${year}`, false);
        return new Promise(function(res, rej) {
            $('#poster').attr('src', url);
            $('#poster').on('load', function() {
                $('#loader').css('display', 'none');
                $('#title').text(`${title} (${year})`);
                res();
            });
        });
    }

    let logic = async (guess) => {
        currentIndex++;
        let c = null;
        let r = -1;
        
        if (guess == correct) {
            c = calculator(true);
            r = 1;
            await feedback('success', 'Correct!');
        } else if (guess == null) {
            c = calculator(false);
            await feedback('error', 'Out of time!', `The correct answer was ${correct}`);
        } else {
            c = calculator(false);
            await feedback('error', 'Incorrect', `The correct answer was ${correct}`);
        }

        await updateStatsDisplay(c);
        updatePackage(ref.movie, guess, score, r);

        log('logic', ref.movie, false);
        log('logic', `guess: ${guess} | correct: ${correct}`, false);

        if (lives < 1 || currentIndex == movieIds.length) {
            log('game over', null, true);
            socket.emit('game', {
				score: score,
				event: 'end',
				mode: 'classic',
				participants: 1,
                sid: sid,
                package: package
			});
            await gameOver();
        } else {
            await loadMovie(movieIds[currentIndex], false);
        }
    }

    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        if (currentIndex == 0) {
            socket.emit('game', {
			    score: score || 0,
				event: 'start',
				mode: 'classic',
				participants: 1,
				sid: null
			});
        }
        await logic($(this).text());
        $('.button').prop('disabled', false);
    });

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    let restartGame = () => {
        shuffle(movieIds);
        currentIndex = 0;
        score = 0;
        lives = 6;
        correct = '';
        package = [];
        ref = {};
        loadMovie(movieIds[currentIndex], true);
        updateStatsDisplay(null);
    }

    socket.on('levelUp', (data) => {
        if (data.newRank) {
            $('#levelUp').text()
        }
    });

    let loaderOn = () => {
        log('loaderOn', null, false);
        $('#loader').css('display', 'block');
        $('#poster').css('display', 'none');
    }

    let loaderOff = () => {
        log('loaderOff', null, false);
        $('#loader').css('display', 'none');
        $('#poster').css('display', 'block');
        let elm = document.getElementById('poster');
        let newone = elm.cloneNode(true);
        elm.parentNode.replaceChild(newone, elm);
    }

    $('.toggle-trigger').click(function() {
        $('.toggle').toggle();
    });

    loaderOn();

    await fillStarters();
    await loadMovie(movieIds[currentIndex], true);
});


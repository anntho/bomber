$(document).ready(async function() {
    let socket = io.connect(socketString);
    let currentIndex = 0;
    let score = 0;
    let lives = 6;
    let actors = [];
    let movies = [];
    let movieIds = [];
    let correct = '';
    let ref = {};
    let package = [];
    let sid = '';
    let log = false;

    socket.on('game', function(data) {
        if (log) {
            console.log('sid received', data);
        }
        sid = data;
    });

    loaderOn();

    await fillStarters();
    await loadMovie(movieIds[currentIndex]);

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function reportError() {
		await swal({
			title: 'Whoops!',
			text: 'An error occured',
			icon: 'error',
			buttons: ['Home', 'Reload Page'],
			closeOnClickOutside: false
		})
		.then((again) => {
			if (again) {
				location.reload();
			} else {
				location.href = '/';
			}
		});
	}

    async function fillStarters() {
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

    async function getCast(id) {
		if (log) {
			console.log('getCast', id);
		}
		socket.emit('getCast', id);
		return new Promise((res, rej) => {
			socket.on('getCast', async (data) => {
				res(data.cast);
			});
			socket.on('err', async () => {
				rej(reportError());
			});
		});
    }
    
    async function getMovie(id) {
		if (log) {
			console.log('getMovie', id);
		}
		socket.emit('getMovie', id);
		return new Promise((res, rej) => {
			socket.on('getMovie', async (data) => {
				res(data);
			});
			socket.on('err', async () => {
				rej(reportError());
			});
		});
	}

    async function loadMovie(id) {
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
        let index = Math.floor(Math.random() * 10);
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
    }

    async function gameOver() {
        hideGamebox();
        restartGame();
    }

    async function guessLogic(guess) {
        currentIndex++;
        if (guess == correct) {
            package.push({
                m: ref.movie,
                g: guess,
                s: score,
                r: 1
            });
            score++;
            $('#score').text(score);
            await swal({
                icon: 'success',
                text: 'Correct!',
                closeOnClickOutside: false
            });
        } else {
            package.push({
                m: ref.movie,
                g: guess,
                s: score,
                r: -1
            });
            lives--;
            $('#lives').text(lives);
            await swal({
                icon: 'error',
                text: `The correct answer was ${correct}`,
                closeOnClickOutside: false
            });
        }
        if (log) {
            console.log(ref.movie);
            console.log('guess: ' + guess, 'correct: ' + correct);
            console.log(package);
        }
    }

    $('.button').click(async function() {
        if ($('.button').prop('disabled')) {
            return false;
        }
        $('.button').prop('disabled', true);
        if (currentIndex == 0) {
            socket.emit('game', {
			    score: score || 0,
				event: 'start',
				mode: 'classic',
				participants: 1,
				sid: null
			});
        }
        await guessLogic($(this).text(), $(this));
        if (lives < 1 || currentIndex == movieIds.length) {
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
            await loadMovie(movieIds[currentIndex]);
        }
        $('.button').prop('disabled', false);
    });

    $('i.replay').click(async function() {
        showGamebox();
    });

    function restartGame() {
        shuffle(movieIds);
        currentIndex = 0;
        score = 0;
        lives = 6;
        correct = '';
        package = [];
        ref = {};
        loadMovie(movieIds[currentIndex]);
        $('#score').text(score);
        $('#lives').text(lives);
    }

    function hideGamebox() {
        $('.gamebox').css('display', 'none');
        $('.gameover').css('display', 'block');
    }

    function showGamebox() {
        $('.gamebox').css('display', 'block');
        $('.gameover').css('display', 'none');
    }

    async function setPosterAndTitle(url, title, year) {
        if (log) console.log('setPosterAndTitle', url, title, year);
        return new Promise(function(res, rej) {
            $('#poster').attr('src', url);
            $('#poster').on('load', function() {
                $('#loader').css('display', 'none');
                $('#title').text(`${title} (${year})`);
                res();
            });
        });
    }

    function loaderOn() {
        if (log) console.log('loaderOn');
        $('#loader').css('display', 'block');
        $('#poster').css('display', 'none');
    }

    function loaderOff() {
        if (log) console.log('loaderOff');
        $('#loader').css('display', 'none');
        $('#poster').css('display', 'block');
        let elm = document.getElementById('poster');
        let newone = elm.cloneNode(true);
        elm.parentNode.replaceChild(newone, elm);
    }
});


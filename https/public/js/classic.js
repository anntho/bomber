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
    let package = [];
    let sid = '';
    let timer = null;
    let counter = 10;
    let interval = 1000;

    let log = (func, data, write) => {
        let all = false;
        if (write || all) {
            console.log('-------------------');
            console.log(func);
            console.log(data);
            console.log('-------------------');
        }
    }

    socket.on('game', function(data) {
        log('sid received', data, false);
        sid = data;
    });

    let shuffle = (a) => {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    let step = () => {
        counter--;
        $('#timer').text(counter);
        if (counter === 0) {
            log('time up', null, false);
            resetTimer();
            logic(null);
        }
    }

    let startTimer = () => {
        if (timer !== null) return;
        log('starting timer', null, false);
        timer = setInterval(step, interval);
    }

    let stopTimer = () => {
        log('stopping timer', null, false);
        resetTimer();
    }

    let resetTimer = () => {
        clearInterval(timer);
        timer = null;
        counter = 10;
        $('#timer').text(counter);
    }

    let feedback = async (icon, title, text) => {
        return await swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
    }

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

    let getCast = async (id) => {
		log('getCast', id, false);
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
    
    let getMovie = async (id) => {
		log('getMovie', id, false);
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

        if (!initial) {
            startTimer();
        }
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

    let updatePackage = (f, g, s, r) => {
        package.push({f: f, g: g, s: s, r: r});
    }

    let updateStatsDisplay = async (c) => {
        $('#score').text(score);
        $('#streak').text(streak);
        $('#lives').text(lives);

        if (streak > 10 || c == null) {
            $('.dots .material-icons').css('color', '#bbb');
        } else {
            $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
        }

        if (c) {
            let text = `${streak} in a row (+${c})`;
            await feedback('success', 'Streak Bonus!', text);
        }
    }

    let calculator = (result) => {
        let pts = 10;
        let add = null;
        if (result) {
            add = 0;
            streak++;
            score += pts;
            if (streak == 2) {
                add = 5; 
                score += add;
            }
            if (streak == 5) {
                add = 10;
                score += add;
            }
            if (streak == 10) {
                add = 50;
                score += add;
            }
        } else {
            streak = 0;
            lives--;
        }
        return add;
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

    let gameOver = async () => {
        $('#finalScore').text(score);
        hideGamebox();
    }

    socket.on('levelUp', (data) => {
        if (data.newRank) {
            $('#levelUp').text()
        }
    });

    let hideGamebox = () => {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }

    let showGamebox = () => {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
    }

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


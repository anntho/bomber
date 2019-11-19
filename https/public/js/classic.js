$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
	// ===================================================
    let currentIndex = 0;
    let score = 0;
    let lives = 6;
    let streak = 0;
    let actors = [];
    let movies = [];
    let movieIds = [];
    let package = [];
    let correct = '';
    let ref = {};
    let sid = '';
    let timer = null;
    let counter = 10;
    let interval = 1000;

    // ===================================================
	// Helpers
	// ===================================================
    await $.getScript( "js/helpers.js");

    // ===================================================
	// Sockets
	// ===================================================
    socket.on('game', function(data) {
        log('sid received', data, false);
        sid = data;
    });

    socket.on('levelUp', (data) => {
        if (data.newRank) {
            $('#levelUp').text()
        }
    });

    let emitGame = (event, sid) => {
        socket.emit('game', {
            score: score || 0,
            event: event,
            mode: 'classic',
            participants: 1,
            sid: sid,
            package: package
        });
    }

    // ===================================================
	// Data Sockets
    // ===================================================
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

    // ===================================================
	// Timer
    // ===================================================
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

    // ===================================================
	// Loader
    // ===================================================
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

    // ===================================================
	// Game Over
    // ===================================================
    let gameOver = () => {
        $('#finalScore').text(score);
        hideGamebox();
    }
    
    let hideGamebox = () => {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }
    
    let showGamebox = () => {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
    }

    // ===================================================
	// Stats 
    // ===================================================
    let updateStats = async (calc) => {
        score = calc.score;
        streak = calc.streak;
        lives = calc.lives;

        $('#score').text(score);
        $('#streak').text(streak);
        $('#lives').text(lives);

        if (streak > 10 || calc.bonus == null) {
            $('.dots .material-icons').css('color', '#bbb');
        } else {
            $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
        }

        if (calc.bonus) {
            let text = `${streak} in a row (+${calc.bonus})`;
            await feedback('success', 'Streak Bonus!', text);
        }
    }

    // ===================================================
	// Package
    // ===================================================
    let updatePackage = (from, guess, score, result) => {
        package.push({f: from, g: guess, s: score, r: result});
    }

    // ===================================================
	// Display
    // ===================================================
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
    
    // ===================================================
	// Logic
    // ===================================================
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

    let logic = async (guess) => {
        currentIndex++;
        let calc = null;
        let r = -1;
        
        if (guess == correct) {
            calc = calculator(true, score, streak, lives);
            r = 1;
            await feedback('success', 'Correct!');
        } else if (guess == null) {
            calc = calculator(false, score, streak, lives);
            await feedback('error', 'Out of time!', `The correct answer was ${correct}`);
        } else {
            calc = calculator(false, score, streak, lives);
            await feedback('error', 'Incorrect', `The correct answer was ${correct}`);
        }

        await updateStats(calc);
        updatePackage(ref.movie, guess, score, r);

        log('logic', ref.movie, false);
        log('logic', `guess: ${guess} | correct: ${correct}`, false);

        if (lives < 1 || currentIndex == movieIds.length) {
            log('game over', null, true);
            emitGame('end', sid);
            await gameOver();
        } else {
            await loadMovie(movieIds[currentIndex], false);
        }
    }

    // ===================================================
	// Restart
    // ===================================================
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

    // ===================================================
	// Event Listeners & Buttons
    // ===================================================
    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        if (currentIndex == 0) {
            emitGame('start', null);
        }
        await logic($(this).text());
        $('.button').prop('disabled', false);
    });

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    $('.toggle-trigger').click(function() {
        $('.toggle').toggle();
    });

    // ===================================================
	// Immediate
    // ===================================================
    loaderOn();

    await fillStarters();
    await loadMovie(movieIds[currentIndex], true);
});


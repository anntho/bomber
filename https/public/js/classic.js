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
    let log = true;
    let timer = null;
    let counter = 10;
    let interval = 1000;

    function step() {
        counter--;
        $('#timer').text(counter);
        if (counter === 0) {
            if (log) console.log('time up');
            resetTimer();
            guessLogic(null);
        }
    }

    function resetTimer() {
        clearInterval(timer);
        timer = null;
        counter = 10;
        $('#timer').text(counter);
    }

    function startTimer() {
        if (timer !== null) return;
        if (log) console.log('starting timer');
        timer = setInterval(step, interval);
    }

    function stopTimer() {
        if (log) console.log('stopping timer');
        resetTimer();
    }

    socket.on('game', function(data) {
        if (log) console.log('sid received', data);
        sid = data;
    });

    loaderOn();

    await fillStarters();
    await loadMovie(movieIds[currentIndex], true);

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function feedback(icon, title, text) {
        return await swal({
            icon: icon,
            title: title,
            text: text,
            closeOnClickOutside: false
        });
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

    async function loadMovie(id, initial) {
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

        if (!initial) {
            startTimer();
        }
    }

    async function guessLogic(guess) {
        currentIndex++;
        let c = null;
        
        if (guess == correct) {
            updatePackage(ref.movie, guess, score, 1);
            c = calculator(true);
            await feedback('success', 'Correct!');
        } else if (guess == null) {
            updatePackage(ref.movie, 'none', score, -1);
            c = calculator(false);
            await feedback('error', 'Out of time!', `The correct answer was ${correct}`);
        } else {
            updatePackage(ref.movie, guess, score, -1);
            c = calculator(false);
            await feedback('error', 'Incorrect', `The correct answer was ${correct}`);
        }

        await updateStatsDisplay(c);

        if (log) {
            console.log(ref.movie);
            console.log('guess: ' + guess, 'correct: ' + correct);
            console.log(package);
        }

        if (lives < 1 || currentIndex == movieIds.length) {
            if (log) console.log('game over');
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

    function updatePackage(m, g, s, r) {
        package.push({m: m, g: g, s: s, r: r});
    }

    async function updateStatsDisplay(c) {
        $('#score').text(score);
        $('#streak').text(streak);
        $('#lives').text(lives);

        if (streak > 10 || c == null) {
            $('.dots .material-icons').css('color', '#bbb');
        } else {
            $(`.dots div:nth-child(${streak}) .material-icons`).css('color', '#ffc107');
        }

        if (c) {
            await feedback('success', 'Streak Bonus!', '+' + streak);
        }
    }

    function calculator(result) {
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
        if ($('.button').prop('disabled')) {
            return false;
        }
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
        await guessLogic($(this).text());
        $('.button').prop('disabled', false);
    });

    $('#restart').click(async function() {
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
        loadMovie(movieIds[currentIndex], true);
        updateStatsDisplay(null);
    }

    async function gameOver() {
        hideGamebox();
        restartGame();
        $('#finalScore').text(score);
    }

    function hideGamebox() {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }

    function showGamebox() {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
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

    $('.toggle-trigger').click(function() {
        $('.toggle').toggle();
    });
});


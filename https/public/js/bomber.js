$(document).ready(async function() {
    // ===================================================
	// Connect Socket
	// ===================================================
    let socket = io.connect(socketString);

    // ===================================================
	// Variables
	// ===================================================
    let start = true;
    let score = 0;
    let lives = 6;
    let streak = 0;
    let actors = [];
    let actorIds = [];
    let movies = [];
    let movieIds = [];
    let usedActors = [];
    let usedMovies = [];
    let ref = {};
    let package = [];
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
    socket.on('game', (data) => {
        log('sid received', data, false);
        sid = data;
    });

    let emitGame = (event, sid) => {
        socket.emit('game', {
            score: score || 0,
            event: event,
            mode: 'bomber',
            participants: 1,
            sid: sid,
            package: package
        });
    }

    // ===================================================
	// Data Sockets
    // ===================================================
    let fillStarters = async () => {
		log('fillStarters', null, false);
		socket.emit('starters');
		return new Promise((res, rej) => {
			socket.on('starters', async (data) => {
				log('fillStarters', 'starters received', false);
				movies = data.movies;
				actors = data.actors;
				movieIds = movies.map(movie => movie.altId);
				actorIds = actors.map(actor => actor.altId);
				res();
			});
			socket.on('err', () => {
                alert('an error occured');
				rej();
			});
		});
    }
    
    let getRandomMovies = (n) => {
		let tempArray = [];
		shuffle(movieIds);
		for (let i = 0; i < n; i++) {
			let movie = movies.find(m => m.altId == movieIds[i]);
			tempArray.push(movie);
		}
		log('getRandomMovies', n, false);
		return tempArray;
    }

	let getRandomActors = (n) => {
		let tempArray = [];
		shuffle(actorIds);
		for (let i = 0; i < n; i++) {
			let actor = actors.find(a => a.altId == actorIds[i]);
			tempArray.push(actor);
		}
		log('getRandomActors', n, false);
		return tempArray;
    }
    
	let getRandomActorsWithExclusions = (n, castIdList) => {
		let tempArray = [];
		shuffle(actorIds);
		actorIds.forEach((a) => {
			if (!castIdList.includes(parseInt(a)) && tempArray.length < n) {
				let actor = actors.find(x => x.altId == a);
				tempArray.push(actor);
			}
		});
        log('getRandomActorsWithExclusions', tempArray, false);
		return tempArray;
    }
    
	let getRandomMoviesWithExclusions = (n, creditsIdList) => {
		let tempArray = [];
		shuffle(movieIds);
		movieIds.forEach(m => {
			if (!creditsIdList.includes(parseInt(m)) && tempArray.length < n) {
                let movie = movies.find(x => x.altId == m);
                tempArray.push(movie);
			}
		});
		log('getRandomMoviesWithExclusions', tempArray, false);
		return tempArray;
    }

    let getCreditsFromActor = async (id) => {
		log('getCreditsFromActor', id, false);
		socket.emit('getCredits', id);
		return new Promise((res, rej) => {
			socket.on('getCredits', async (data) => {
				res(data.cast);
			});
			socket.on('err', async () => {
                alert('an error occured');
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
                alert('an error occured');
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
            logic(null, null);
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
        $('.prompt').hide();
        $('#face').hide();
        $('#faceLoader').show();
    }

    let loaderOff = () => {
        log('loaderOff', null, false);
        $('.prompt').css('display', 'flex');
        $('#face').show();
        $('#faceLoader').hide();
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
	// Reference
    // ===================================================
    let updateReference = (type, name, id, from, reset) => {
        ref.type = type;
        ref.name = name;
        ref.id = id;
        ref.reset = reset;
        ref.from = from;
    }

    // ===================================================
	// Display
    // ===================================================
    let setDialouge = (p) => {
        $('.prompt').each(function() {
            $(this).removeClass('slide');
            $(this).addClass('slide');
        });
        $('#prompt').text(p);
        log('setDialouge', p, false);
    }

    let setButtonsActors = async (actor, exclusions) => {
        let list = await getRandomActorsWithExclusions(3, exclusions);
        list.push(actor);
        shuffle(list);
        $('.button').each(function(i) {
            $(this).text(list[i].name);
            $(this).attr('data-id', list[i].altId);
        });
        log('setButtonsActors', list, false);
    }

    let setButtonsMovies = async (movie, exclusions, reset) => {
        let list = [];
        if (reset) {
            list = await getRandomMovies(4);
        } else {
            list = await getRandomMoviesWithExclusions(3, exclusions);
            list.push(movie);
        }
        shuffle(list);
        $('.button').each(function(i) {
            $(this).text(formatTitle(list[i].title, list[i].year));
            $(this).attr('data-id', list[i].altId);
        });
        log('setButtonsMovies', list, false);
    }

    // ===================================================
	// Logic
    // ===================================================
	let pickMovie = async (initial) => {
        let prompt = '';
        if (initial) {
            prompt = `Pick a movie from the list below to start the game`;
        } else {
            prompt = 'Send it back by picking a movie from the list';
        }

        setDialouge(prompt);
        updateReference('movie', null, null, null, true);
        await setButtonsMovies(null, null, true);
		log('userPickActor', ref, false);
    }

    let guessActorFromMovie = async (id, title) => {
		log('guessActorFromMovie [start]', id, false);
		let actor = {};
        let cast = [];
        let castIds = [];

        cast = await getCast(id);
        castIds = cast.map(c => c.id);

        for (const c of cast) {
            if (!usedActors.includes(c.id)) {
                actor = {
                    altId: c.id,
                    name: c.name
                }
                break;
            }
        }

        usedActors.push(parseInt(actor.altId));

		setDialouge(`Which of the following actors was in ${title}`);
        updateReference('actor', actor.name, actor.altId, title, false);
		await setButtonsActors(actor, castIds);
		log('guessActorFromMovie [end]', ref, false);
    }
    
    let guessMovieFromActor = async (id, name) => {
        log('guessMovieFromActr [start]', id, false);
        let movie = {};
        let credits = [];
        let creditsIds = [];

        credits = await getCreditsFromActor(id);
        creditsIds = credits.map(c => c.id);

        for (const c of credits) {
            if (!usedMovies.includes(c.id)) {
                movie = {
                    altId: c.id,
                    title: c.title,
                    year: c.release_date.split('-')[0]
                }
                break;
            }
        }

        usedMovies.push(parseInt(movie.altId));

        setDialouge(`${name} was in which of the following movies?`);
        updateReference('movie', formatTitle(movie.title, movie.year), movie.altId, false);
        await setButtonsMovies(movie, creditsIds, false);
        log('guessMovieFromActor [start]', ref, false);
    }

    let logic = async (guessId, guessText) => {
        log('logic [input]', `${guessId} | ${guessText}`, false);
        log('logic [ref]', `${ref.name} | ${ref.id}`, false);
        
        let calc = null;
        let r = -1;
        loaderOn();

        if (start) {
            emitGame('start', null);
            start = false;
        }

        if (ref.reset) {
            usedMovies.push(parseInt(guessId));
            await guessActorFromMovie(guessId, guessText);
            loaderOff();
        } else {
            if (guessId == ref.id) {
                log('logic [match]', `${guessId} == ${ref.id}`, true);
                calc = calculator(true, streak, score, lives);
                r = 1;
                await feedback('success', 'Correct!');
            } else {
                log('logic [mismatch]', `${guessId} == ${ref.id}`, true);
                calc = calculator(false, streak, score, lives);
                await feedback('error', 'Incorrect', `The correct answer was ${ref.name}`);
            }

            await updateStats(calc);
            updatePackage(ref.name, guessText, score, r);

            if (lives < 1) {
                console.log('game over');
                emitGame('end', sid);
                await gameOver();
            } else if (ref.type == 'actor') {
                await guessMovieFromActor(guessId, guessText);
                loaderOff();
            } else {
                await guessActorFromMovie(guessId, guessText);
                loaderOff();
            }
        }

        if (!start) startTimer();
    }

    // ===================================================
	// Restart
    // ===================================================
    let restartGame = async () => {
        start = true;
        score = 0;
        lives = 6;
        streak = 0;
        usedActors = [];
        usedMovies = [];
        package = [];
        ref = {};
        updateStats(null);
        await pickMovie(true);
    }

    // ===================================================
	// Event Listeners & Buttons
    // ===================================================
    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        await logic($(this).attr('data-id'), $(this).text()); // id is not updating quick enough
        $('.button').prop('disabled', false);
    });

    $('#restart').click(async function() {
        restartGame();
        showGamebox();
    });

    // ===================================================
	// Immediate
    // ===================================================

    await fillStarters();
    await pickMovie(true);
});


$(document).ready(async function() {
    let socket = io.connect(socketString);
    let score = 0;
    let lives = 6;
    let streak = 0;
    let actors = [];
    let actorIds = [];
    let movies = [];
    let movieIds = [];
    let usedActors = [];
    let usedMovies = [];
    let correct = '';
    let ref = {};
    let package = [];
    let sid = '';
    let log = true;
    let timer = null;
    let counter = 10;
    let interval = 1000;
    let crazy = false;

    socket.on('game', (data) => {
        if (log) console.log('sid received', data);
        sid = data;
    });

    let emitGame = (event, sid) => {
        socket.emit('game', {
            score: score || 0,
            event: event,
            mode: 'bomber',
            participants: 1,
            sid: sid
        });
    }

    let loaderOn = () => {
        if (log) console.log('loaderOn');
        $('.prompt').hide();
        $('#face').hide();
        $('#faceLoader').show();
    }

    let loaderOff = () => {
        if (log) console.log('loaderOff');
        $('.prompt').css('display', 'flex');
        $('#face').show();
        $('#faceLoader').hide();
    }

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
            if (log) console.log('time up');
            resetTimer();
            logic(null);
        }
    }

    let startTimer = () => {
        if (timer !== null) return;
        if (log) console.log('starting timer');
        timer = setInterval(step, interval);
    }

    let stopTimer = () => {
        if (log) console.log('stopping timer');
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

    let fillStarters = async () => {
		if (log) console.log('fillStarters');
		socket.emit('starters');
		return new Promise((res, rej) => {
			socket.on('starters', async (data) => {
				if (log) console.log('starters received');
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
			tempArray.push(`${movie.title} (${movie.year})`);
		}
		if (log) console.log('getRandomMovies', n);
		return tempArray;
    }

	let getRandomActors = (n) => {
		let tempArray = [];
		shuffle(actorIds);
		for (let i = 0; i < n; i++) {
			let actor = actors.find(a => a.altId == actorIds[i]);
			tempArray.push(actor.name);
		}
		if (log) console.log('getRandomActors', n);
		return tempArray;
    }
    
	let getRandomActorsWithExclusions = (n, id, castIdList) => {
		let tempArray = [];
		shuffle(actorIds);
		actorIds.forEach((a) => {
			if (!castIdList.includes(parseInt(a)) && tempArray.length < n) {
				let actor = actors.find(x => x.altId == a);
				tempArray.push(actor.name);
			}
		});
		if (log) console.log('getRandomActorsWithExclusions', n, id);
		return tempArray;
    }
    
	let getRandomMoviesWithExclusions = (n, id, creditsIdList) => {
		let tempArray = [];
		shuffle(movieIds);
		movieIds.forEach(m => {
			if (!creditsIdList.includes(parseInt(m)) && tempArray.length < n) {
                let movie = movies.find(x => x.altId == m);
                tempArray.push(`${movie.title} (${movie.year})`);
			}
		});
		if (log) console.log('getRandomMoviesWithExclusions', n, id);
		return tempArray;
	}
    
    let setDialouge = (a, b) => {
        if (log) console.log('setDialouge', a, b);
        $('.prompt').each(function() {
            $(this).removeClass('slide');
            $(this).addClass('slide');
        });
        
        $('#prompt-a').text(a);
        $('#prompt-b').text(b);
    }

    let getCreditsFromActor = async (id) => {
		if (log) console.log('getCreditsFromActor', id);
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
		if (log) console.log('getCast', id);
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

    let setButtons = async (type, name, id, exclusions) => {
        let list = [];
        if (type == 'actor') {
            list = await getRandomActorsWithExclusions(3, id, exclusions);
        } else if (type == 'movie') {
            list = await getRandomMoviesWithExclusions(3, id, exclusions);
        }
        list.push(name);
        shuffle(list);
        ref.name = name;
        ref.id = id;
        ref.type = type;
        $('.button').each(function(i) {
            $(this).text(list[i]);
        });
    }

	let pickMovie = (initial) => {
        let movies = getRandomMovies(4);
        let a = '';
        let b = '';

        $('.button').each(function(i) {
            $(this).text(movies[i]);
        });

        if (initial) {
            a = `Let's play moviebomber!`;
            b = 'Start it off by picking a movie from the list';
            emitGame('start', null);
        } else {
            a = 'Send it back by picking a movie from the list';
        }

        setDialouge(a, b);
        ref = {};
        ref.type = 'actor';
        if (initial) ref.reset = true;

		if (log) console.log('userPickActor', ref);
    }

	let guessActor = async (name) => {
		if (log) console.log('guessActor', name);
		let pos = 0;
		let ipActor = {};
		let credits = [];
		let credit = {};
		let cast = [];
		let castIds = [];
		let movie = {};
		let actor = {};
		let exclusions = [];

		// Credits from actor
		ipActor = actors.find(a => a.name === name);
		credits = await getCreditsFromActor(ipActor.altId);
		credits.sort((a, b) => b.vote_count-a.vote_count);
		
		// Movie from credits
		if (crazy) {
			credit = credits[Math.floor(Math.random()*credits.length)];
		} else {
			credit = credits[0];
		}

		movie = {
            id: credit.id,
            title: `${credit.title} (${credit.release_date.substring(0, 4)})`
        }

		cast = await getCast(movie.id);

		// Remove target from cast
		pos = cast.map(x => x.id).indexOf(ipActor.altId);
		cast.splice(pos, 1);
		castIds = cast.map(x => x.id);

		// Create exclusions list
		exclusions = castIds.slice();
		exclusions.push(ipActor.altId);

		// Get actor from cast
		actor = {id: cast[0].id, name: cast[0].name}

		usedActors.push(actor);
		usedMovies.push(movie);
        ref.prev = movie.title;
        
        setDialouge(
            `${name} was in ${movie.title}`, 
            `Can you name another actor that was in ${movie.title}?`
        );

		setButtons('actor', actor.name, actor.id, exclusions);

		if (log) console.log('guessActor', ref);
	}

    async function logic(input) {
        loaderOn();
        if (ref.reset) {
            
        }
    }








    await fillStarters();
    await pickMovie(true);


    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        await logic($(this).text());
        $('.button').prop('disabled', false);
    });




    

    /*
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

    async function logic(guess) {
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
            let text = `${streak} in a row (+${c})`;
            await feedback('success', 'Streak Bonus!', text);
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

    $('#restart').click(async function() {
        restartGame();
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
        $('#finalScore').text(score);
        hideGamebox();
    }

    function hideGamebox() {
        $('#board').css('display', 'none');
        $('#go').css('display', 'block');
    }

    function showGamebox() {
        $('#board').css('display', 'block');
        $('#go').css('display', 'none');
    }
    */
});


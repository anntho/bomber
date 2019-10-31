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

    let wait = async (ms) => {
		return new Promise(r => setTimeout(r, ms));
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
			tempArray.push(movie);
		}
		if (log) console.log('getRandomMovies', n);
		return tempArray;
    }

	let getRandomActors = (n) => {
		let tempArray = [];
		shuffle(actorIds);
		for (let i = 0; i < n; i++) {
			let actor = actors.find(a => a.altId == actorIds[i]);
			tempArray.push(actor);
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
				tempArray.push(actor);
			}
		});
        if (log) console.log('getRandomActorsWithExclusions', n, id, tempArray);
		return tempArray;
    }
    
	let getRandomMoviesWithExclusions = (n, id, creditsIdList) => {
		let tempArray = [];
		shuffle(movieIds);
		movieIds.forEach(m => {
			if (!creditsIdList.includes(parseInt(m)) && tempArray.length < n) {
                let movie = movies.find(x => x.altId == m);
                tempArray.push(movie);
			}
		});
		if (log) console.log('getRandomMoviesWithExclusions', n, id, tempArray);
		return tempArray;
	}
    
    let setDialouge = (p) => {
        if (log) console.log('setDialouge', p);
        $('.prompt').each(function() {
            $(this).removeClass('slide');
            $(this).addClass('slide');
        });
        $('#prompt').text(p);
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

    let updateReference = (type, name, id, from, reset) => {
        ref.type = type;
        ref.name = name;
        ref.id = id;
        ref.reset = reset;
        ref.from = from;
    }

    let setButtons = async (type, name, id, exclusions) => {
        let list = [];
        if (type == 'actor') {
            list = await getRandomActorsWithExclusions(3, id, exclusions);
        } else if (type == 'movie') {
            list = await getRandomMoviesWithExclusions(3, id, exclusions);
        }
        
        list.push({
            altId: id,
            name: name
        });
        shuffle(list);

        $('.button').each(function(i) {
            if (type == 'actor') {
                $(this).text(list[i].name);
            } else {
                $(this).text(`${list[i].title} (${list[i].year})`);
            }
            $(this).attr('data-id', list[i].altId);
        });
    }

	let pickMovie = (initial) => {
        let prompt = '';
        let movies = getRandomMovies(4);
        
        shuffle(movies);
        $('.button').each(function(i) {
            $(this).text(`${movies[i].title} (${movies[i].year})`);
            $(this).attr('data-id', movies[i].altId);
        });

        if (initial) {
            prompt = `Start us off by picking a movie from the list`;
            emitGame('start', null);
        } else {
            prompt = 'Send it back by picking a movie from the list';
        }

        setDialouge(prompt);
        updateReference('movie', null, null, null, true);

		if (log) console.log('userPickActor', ref);
    }

    let guessActorFromMovie = async (id) => {
		if (this.log) console.log('start', 'guessActorFromMovie', id);
        let baseMovie = {};
        let baseMovieTitle = '';
		let actor = {};
        let cast = [];
        let castIds = [];

        baseMovie = movies.find(m => m.altId == id); // might have to use api call here if its not the iniital 
        baseMovieTitle = `${baseMovie.title} (${baseMovie.year})`;
        cast = await getCast(baseMovie.altId);
        castIds = cast.map(c => c.id);
        console.log(castIds)

        for (const c of cast) {
            if (!usedActors.some(a => a.altId == c.id)) {
                actor = {
                    id: c.id,
                    name: c.name
                }
                break;
            }
        }

		setDialouge(`Name an actor in ${baseMovieTitle}`);
        updateReference('actor', actor.name, actor.id, baseMovieTitle, false);
		await setButtons('actor', actor.name, actor.id, castIds);
		if (log) console.log('end', 'guessActorFromMovie', ref);
	}

    async function logic(id) {
        if (log) console.log(id);
        loaderOn();
        if (ref.reset) {
            if (log) console.log('logic', 'reset');
            await guessActorFromMovie(id);
            await wait(500);
            loaderOff();
        } else {
            console.log(ref.id)
            if (id == ref.id) {
                alert(true)
            } else {
                alert(false)
            }
        }
    }





    await fillStarters();
    await pickMovie(true);

    $('.button').click(async function() {
        if ($('.button').prop('disabled')) return false;
        $('.button').prop('disabled', true);
        stopTimer();
        await logic($(this).data('id')); // id is not updating quick enough
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


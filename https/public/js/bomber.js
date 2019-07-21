/* Copyright 2018, Anthony Pecoraro. All Rights Reserved */

class API {
	constructor() {
		this.movies = {};
		this.actors = {};
		this.keyListMovies = [];
		this.keyListActors = [];
		this.valueListMovies = [];
		this.valueListActors = [];
		this.urlMovie = '/data/movie/'
		this.urlCast = '/data/movie/cast/';
		this.urlCredits = '/data/person/credits/';
		this.logAPI = true;
	}
	shuffle(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	async fillStarters() {
		if (this.logAPI) {
			console.log('fillStarters');
		}
		let resMovies = await fetch('/data/movie_list');
		let resActors = await fetch('/data/actor_list');
		let dataMovies = await resMovies.json();
		let dataActors = await resActors.json();
		this.movies = dataMovies;
		this.actors = dataActors;
		this.keyListMovies = this.movies.map(movie => movie.altId);
		this.keyListActors = this.actors.map(actor => actor.altId);
	}
	getRandomActorsNoReq(n) {
		if (this.logAPI) {
			console.log('getRandomActorsNoReq', n);
		}
		let tempArray = [];
		this.shuffle(this.keyListActors);
		for (let i = 0; i < n; i++) {
			let actor = this.actors.find(a => a.altId == this.keyListActors[i])
			tempArray.push(actor.name);
		}
		return tempArray;
	}
	getRandomActors(n, id, castIdList) {
		if (this.logAPI) {
			console.log('getRandomActors', n, id, castIdList);
		}
		let tempArray = [];
		this.shuffle(this.keyListActors);
		this.keyListActors.forEach((a) => {
			if (!castIdList.includes(parseInt(a)) && tempArray.length < n) {
				let actor = this.actors.find(x => x.altId == a);
				tempArray.push(actor.name);
			}
		});
		return tempArray;
	}
	getRandomMoviesNoReq(n) {
		if (this.logAPI) {
			console.log('getRandomMoviesNoReq', n);
		}
		let tempArray = [];
		this.shuffle(this.keyListMovies);
		for (let i = 0; i < n; i++) {
			let movie = this.movies.find(m => m.altId == this.keyListMovies[i])
			tempArray.push(movie.title + ' (' + movie.year + ')');
		}
		console.log(tempArray)
		return tempArray;
	}
	getRandomMovies(n, id, creditsIdList) {
		if (this.logAPI) {
			console.log('getRandomMovies', n, id, creditsIdList);
		}
		let tempArray = [];
		this.shuffle(this.keyListMovies);
		this.keyListMovies.forEach(m => {
			if (!creditsIdList.includes(parseInt(m)) && tempArray.length < n) {
				let movie = this.movies.find(x => x.altId == m);
				tempArray.push(movie.title + ' (' + movie.year + ')');
			}
		});
		return tempArray;
	}
	async getMovieById(id) {
		if (this.logAPI) {
			console.log('getMovieById', id);
		}
		try {
			let resMovie = await fetch(this.urlMovie + id);
			return await resMovie.json();
		} catch (err) {
			location.reload();
		}
	}
	async getRandomMovie() {
		if (this.logAPI) {
			console.log('getRandomMovie');
		}
		try {
			let randMovie = this.keyListMovies[Math.floor(Math.random()*this.keyListMovies.length)];
			let resMovie = await fetch(this.urlMovie + randMovie);
			return await resMovie.json();
		} catch (err) {
			location.reload();
		}
	}
	async getCast(id) {
		if (this.logAPI) {
			console.log('getCast', id);
		}
		try {
			let resCast = await fetch(this.urlCast + id);
			return await resCast.json();
		} catch (err) {
			location.reload();
		}
	}
	async getCreditsFromActor(id) {
		if (this.logAPI) {
			console.log('getCreditsFromActor', id);
		}
		try {
			let resCredits = await fetch(this.urlCredits + id);
			return await resCredits.json();
		} catch (err) {
			alert(err)
		}
	}
}

class DOMElements {
	constructor() {
		this.dialougeBoxA = document.getElementById('prompt-a');
		this.dialougeBoxB = document.getElementById('prompt-b');
		this.dialougeBoxC = document.getElementById('prompt-c');
		this.buttons = document.querySelectorAll('.button');
		this.lives = document.getElementById('lives');
		this.correct = document.getElementById('score');
		this.crazy = document.getElementById('crazy');
		this.normal = document.getElementById('normal');
		this.restart = document.getElementById('restart');
		this.prompts = document.querySelectorAll('.prompt');
		this.loader = document.getElementById('loader');
		this.gamebox = document.querySelector('.gamebox');
		this.gameover = document.querySelector('.gameover');
		this.replay = document.querySelector('i.replay');
		this.myscore = document.getElementById('myscore');
	}
	async wait(ms) {
		return new Promise(r => setTimeout(r, ms));
	}
	hideGamebox() {
		this.gamebox.style.display = 'none';
		this.gameover.style.display = 'block';
	}
	showGamebox() {
		this.gamebox.style.display = 'block';
		this.gameover.style.display = 'none';
	}
	loaderOn() {
		this.prompts.forEach(prompt => {
			prompt.style.display = 'none';
		});
		this.loader.style.display = 'block';
	}
	loaderOff() {
		this.prompts.forEach(prompt => {
			prompt.style.display = 'flex'
		});
		this.loader.style.display = 'none';
	}
	setDialouge(a, b) {
		this.prompts.forEach(prompt => {
			prompt.classList.remove('slide')
			prompt.classList.add('slide')

		})
		this.dialougeBoxA.textContent = a;
		this.dialougeBoxB.textContent = b;
	}
	updateLivesDisplay(a) {
		this.lives.textContent = String(a);
	}
	updateScoreDisplay(a) {
		this.correct.textContent = String(a);
	}
	newRecord(a, b, c) {
		let trail = document.getElementById('log-container');
		let newRec = document.createElement('span');
		newRec.textContent = a + ' > ' + b + ' > ' + c;
		//trail.insertBefore(newRec, trail.childNodes[0]);
	}
	async animateCorrect() {
		await swal({
			icon: 'success',
			text: `Correct!`,
			closeOnClickOutside: false
		});
	}
	async animateIncorrect(correct) {
		await swal({
			icon: 'error',
			text: `The correct answer was ${correct}`,
			closeOnClickOutside: false
		});
	}
}

class Reference {
	constructor() {
		this.name = '';
		this.id = 0;
		this.type = 'actor';
		this.reset = false;
		this.prev = '';
		this.flowActorGuessingActor = [];
		this.flowMovieGuessingActor = [];
		this.flowActorGuessingMovie = [];
		this.flowMovieGuessingMovie = [];
		this.crazy = false;
	}
	setNameAndId(a, b) {
		this.name = a;
		this.id = b;
	}
	setBigFour(a, b, c, d) {
		this.name = a;
		this.id = b;
		this.type = c;
		this.reset = d;
	}
	clearBigFour() {
		this.name = '';
		this.id = 0;
		this.type = '';
		this.reset = false;
	}
}

class User {
	constructor() {
		this.score = 0;
		this.lives = 6;
	}
	updateScore() {
		++this.score;
	}
	decreaseLives() {
		--this.lives;
	}
}

class GameLogic {
	constructor(a, b, c, d, e, f, g, h) {
		this.api = a;
		this.dom = b;
		this.ref = c;
		this.user = d;
		this.createRecs = e;
		this.socket = f;
		this.username = g;
		this.userId = h;
	}
	brackets(str) {
		return `${str}`;
	}
	async pauser(ms) {
		return new Promise(r => setTimeout(r, ms));
	}
	async mainUserGuessActor() {
		console.log('mainUserGuessActor')
		let random = 0;
		let credits = [];
		let cast = [];
		let freeMovies = [];
		let freeActors = [];
		let castIds = [];
		let movie = {};
		let actor = {};

		// Get Credits from Actor
		credits = await this.api.getCreditsFromActor(this.ref.id);
		credits.sort((a, b) => b.vote_count-a.vote_count);

		if (this.ref.crazy) {
			console.log('crazy mode is on');
			this.api.shuffle(credits);
		}

		// Find Unused Movie from Credits
		credits.forEach((creditObj, index) => {
			if (!this.ref.flowMovieGuessingActor.find(x => x.id === creditObj.id)) {
				freeMovies.push(index);
			}
		});
		movie = {id: credits[freeMovies[0]].id, title: credits[freeMovies[0]].title + ' (' + credits[freeMovies[0]].release_date.substring(0, 4) + ')'}

		// Get Cast from Movie
		cast = await this.api.getCast(movie.id);

		// Find Unused Actor from Cast & Create Id List
		cast.forEach((castObj, index) => {
			castIds.push(castObj.id);
			if (!this.ref.flowActorGuessingActor.find(x => x.id === castObj.id)) {
				freeActors.push(index);
			}
		});

		if (freeActors.length > 4) {
			random = Math.floor(Math.random()*4);
			actor = {id: cast[freeActors[random]].id, name: cast[freeActors[random]].name}
		} else {
			actor = {id: cast[freeActors[0]].id, name: cast[freeActors[0]].name}
		}

		if (this.createRecs) {
			// Create New History Record
			this.dom.newRecord(this.ref.prev, this.ref.name, 'correct');
		}

		// Update Prompts
		this.dom.setDialouge(
			this.brackets(this.ref.name) + ' was also in ' + this.brackets(movie.title),
			'Can you name another actor in ' + this.brackets(movie.title) + '?'
		);
		
		// Update Reference
		this.ref.flowMovieGuessingActor.push(movie);
		this.ref.flowActorGuessingActor.push(actor);
		this.ref.prev = movie.title;

		// Set Buttons
		await this.setBtnsActor(actor.name, actor.id, castIds);
	}
	async mainUserGuessMovie() {
		console.log('mainUserGuessMovie')
		let random = 0;
		let cast = [];
		let credits = [];
		let freeActors = [];
		let freeMovies = [];
		let creditsIds = [];
		let actor = {};
		let movie = {};

		// Find Actor in Cast
		cast = await this.api.getCast(this.ref.id);
		cast.forEach((castObj, index) => {
			if (!this.ref.flowActorGuessingMovie.find(x => x.id === castObj.id)) {
				freeActors.push(index);
			}
		});
		actor = {id: cast[freeActors[0]].id, name: cast[freeActors[0]].name}

		// Get Credits from Actor
		credits = await this.api.getCreditsFromActor(actor.id);
		credits.sort((a, b) => b.vote_count-a.vote_count);

		// Shuffle Credits if CRAZY
		if (this.ref.crazy) {
			console.log('crazy mode is on');
			this.api.shuffle(credits);
		}

		// Get movie from actor credits & while in the loop also create id list
		credits.forEach((creditObj, index) => {
			creditsIds.push(creditObj.id);
			if (!this.ref.flowMovieGuessingMovie.find(x => x.id === creditObj.id)) {
				freeMovies.push(index);
			}
		});

		if (freeMovies.length > 4) {
			random = Math.floor(Math.random()*4);
			movie = {id: credits[freeMovies[random]].id, title: credits[freeMovies[random]].title + ' (' + credits[freeMovies[random]].release_date.substring(0, 4) + ')'}
		} else {
			movie = {id: credits[freeMovies[0]].id, title: credits[freeMovies[0]].title + ' (' + credits[freeMovies[0]].release_date.substring(0, 4) + ')'}
		}

		if (this.createRecs) {
			// Create New History Record
			this.dom.newRecord(this.ref.prev, this.ref.name, 'correct');
		}

		// Update Prompts
		this.dom.setDialouge(
			this.brackets(actor.name) + ' was also in ' + this.brackets(this.ref.name),
			'Can you guess another movie ' + this.brackets(actor.name) + ' was in?'
		);

		// Update Reference
		this.ref.flowActorGuessingMovie.push(actor);
		this.ref.flowMovieGuessingMovie.push(movie);
		this.ref.prev = actor.name;

		// Set Buttons
		await this.setBtnsMovie(movie.title, movie.id, creditsIds);
	}
	async switchToActors(actorName) { // updated
		console.log('switchToActors', actorName)
		let pos = 0;
		let ipActor = {};
		let credits = [];
		let credit = {};
		let cast = [];
		let castIds = [];
		let movie = {};
		let actor = {};
		let exclusions = [];

		// Get Credits from Actor
		ipActor = this.api.actors.find(actor => actor.name === actorName);
		credits = await this.api.getCreditsFromActor(ipActor.altId);
		credits.sort((a, b) => b.vote_count-a.vote_count);
		
		// Get Movie from Actor Credits
		if (this.ref.crazy) {
			console.log('crazy mode is on');
			credit = credits[Math.floor(Math.random()*credits.length)];
		} else {
			credit = credits[0];
		}

		movie = {id: credit.id, title: credit.title + ' (' + credit.release_date.substring(0, 4) + ')'}

		// Get Cast from Movie
		cast = await this.api.getCast(movie.id);

		// Remove Input Actor From Cast
		pos = cast.map(x => x.id).indexOf(ipActor.altId);
		cast.splice(pos, 1);
		castIds = cast.map(x => x.id);

		// Create Exclusions List
		exclusions = castIds.slice();
		exclusions.push(ipActor.altId);

		// Get Actor from Cast
		actor = {id: cast[0].id, name: cast[0].name}

		// Update Reference
		this.ref.flowActorGuessingActor.push(actor);
		this.ref.flowMovieGuessingActor.push(movie);
		this.ref.prev = movie.title;

		// Update Prompts
		this.dom.setDialouge(
			this.brackets(actorName) + ' was in ' + this.brackets(movie.title),
			'Can you name another actor in ' + this.brackets(movie.title) + '?'
		);

		// Set Buttons
		await this.setBtnsActor(actor.name, actor.id, exclusions);
	}
	async switchToMovies(movieTitle) { // updated
		console.log('switchToMovies', movieTitle)
		let pos = 0;
		let ipMovieId = 0;
		let ipMovie = {};
		let actor = {};
		let movie = {};
		let credit = {};
		let cast = [];
		let credits = [];
		let creditsIds = [];
		let exclusions = [];

		// Get Movie & Cast from Input
		ipMovie = this.api.movies.find(m => (m.title + ' (' + m.year + ')') == movieTitle); // update logic to use data attribute instead of string match

		cast = await this.api.getCast(ipMovie.altId);
		
		// Select Actor from Cast
		actor = {id: cast[0].id, name: cast[0].name}

		// Get Credits from Actor
		credits = await this.api.getCreditsFromActor(actor.id);

		// Remove Input Movie from Credits
		pos = credits.map(x => x.id).indexOf(ipMovie.altId);
		credits.splice(pos, 1);
		credits.forEach((x) => creditsIds.push(x.id));

		// Create List of Movies to Exclude from Random Choices
		exclusions = creditsIds.slice();
		exclusions.push(ipMovie.altId);

		// Sort Credits by Votes
		credits.sort((a, b) => b.vote_count-a.vote_count);

		// Get Movie from Credits
		if (this.ref.crazy) {
			console.log('crazy mode is on');
			credit = credits[Math.floor(Math.random()*credits.length)];
		} else {
			credit = credits[0];
		}

		movie = {id: credit.id, title: credit.title + ' (' + credit.release_date.substring(0, 4) + ')'}

		// Update Reference
		this.ref.flowActorGuessingMovie.push(actor);
		this.ref.flowMovieGuessingMovie.push(movie);
		this.ref.prev = actor.name;

		// Update Prompts
		this.dom.setDialouge(
			this.brackets(actor.name) + ' was in ' + this.brackets(movieTitle),
			'Can you guess another movie that ' + this.brackets(actor.name) + ' was in?'
		);

		// Set Buttons
		await this.setBtnsMovie(movie.title, movie.id, exclusions);
	}
	async userPickActor() {
		let actors = this.api.getRandomActorsNoReq(4);
		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = actors[key];
		});
		this.dom.setDialouge('Send it back to me by picking an actor from the list below.');
		this.ref.clearBigFour();
		this.ref.type = 'actor';
		this.ref.reset = true;
	}
	async userPickMovie(start) {
		let movies = this.api.getRandomMoviesNoReq(4);
		let msgA = 'Send it back by picking a movie from the list below.';
		let msgB = '';
		if (start) {
			msgA = "Let's play movie bomber!";
			msgB = 'You can start it off by picking a movie from the list below.'
		}

		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = movies[key];
		});
		this.dom.setDialouge(msgA, msgB);
		
		// Udate Reference
		this.ref.clearBigFour();
		this.ref.type = 'movie';
		this.ref.reset = true;
	}
	async setBtnsActor(name, id, cast) {
		let randomActors = this.api.getRandomActors(3, id, cast);
		randomActors.push(name);
		this.api.shuffle(randomActors);
		this.ref.setBigFour(name, id, 'actor', false);
		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = randomActors[key];
		});
	}
	async setBtnsMovie(title, id, credits) {
		console.log('setBtnsMovie', title, id, credits)
		let randomMovies = await this.api.getRandomMovies(3, id, credits);
		randomMovies.push(title);
		this.api.shuffle(randomMovies);
		this.ref.setBigFour(title, id, 'movie', false);
		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = randomMovies[key];
		});
	}
	async eventDriver(userInput, pressedIdx) {
		if (this.ref.reset === true) {
			console.log('reset = true')
			this.dom.loaderOn();
			if (this.ref.type === 'movie') {
				await this.switchToMovies(userInput);
				await this.dom.wait(500)
				this.dom.loaderOff();
			} else if (this.ref.type === 'actor') {
				await this.switchToActors(userInput);
				await this.dom.wait(500)
				this.dom.loaderOff();
			}
		} else if (userInput === this.ref.name) {
			await this.dom.animateCorrect(this.ref.name);

			this.dom.loaderOn();

			this.user.updateScore();
			this.dom.updateScoreDisplay(this.user.score);

			if (this.ref.type === 'actor') {
				await this.mainUserGuessActor();
				this.dom.loaderOff();
			} else if (this.ref.type === 'movie') {
				await this.mainUserGuessMovie();
				this.dom.loaderOff();
			}  
		} else {
			let idx = 0;
			this.dom.buttons.forEach((b, i) => {
				if (b.textContent === this.ref.name) {
					idx = i;
				}
			});

			await this.dom.animateIncorrect(this.ref.name);
			this.dom.loaderOn();
			this.user.decreaseLives();
			this.dom.updateLivesDisplay(this.user.lives);

			if (this.createRecs) {
				this.dom.newRecord(this.ref.prev, userInput, 'incorrect');
			}

			this.user.lives = 0; // testing
			if (this.user.lives < 1) {
				this.dom.hideGamebox();
				//await restartGame();

				await swal({
					title: 'Game Over',
					closeOnClickOutside: false
				});

				this.socket.emit('score', {
					score: this.user.score,
					name: this.userId,
					mode: 'bomber'
				});

			} else {
				if (this.ref.type === 'actor') {
					await this.userPickMovie();
					this.dom.loaderOff();
				} else if (this.ref.type === 'movie') {
					await this.userPickActor();
					this.dom.loaderOff();
				}
			}
		}
	}
}


document.addEventListener('DOMContentLoaded', async () => {
	let socket = io.connect(socketString);
	console.log('socket connected')

	// Instantiations
	let mrAPI = new API();
	let mrDom = new DOMElements();
	let mrRef = new Reference();
	let mrUser = new User();
	let mrBomber = new GameLogic(mrAPI, mrDom, mrRef, mrUser, true, socket, usernameString, userIdString);

	// First Events
	await mrAPI.fillStarters();
	await mrBomber.userPickMovie(true);

	// Listeners
	mrDom.buttons.forEach((btn, index) => {
		btn.addEventListener('click', async (evt) => {
			if (btn.disabled) return false;
			btn.disabled = true;
			await mrBomber.eventDriver(btn.textContent, index);
			btn.disabled = false;
		});
	});

	mrDom.replay.addEventListener('click', async (evt) => {
		mrDom.showGamebox();
	});

	async function restartGame() {
		console.log('restarting game')
		mrBomber = null;
		mrRef = null;
		mrUser = null;
		mrRef = new Reference();
		mrUser = new User();

		mrBomber = new GameLogic(mrAPI, mrDom, mrRef, mrUser, true);
		mrDom.updateLivesDisplay(mrUser.lives);
		mrDom.updateScoreDisplay(mrUser.score);
		mrDom.loaderOff();
		await mrBomber.userPickMovie(true);
	}
});



window.addEventListener('touchstart', function onTouch() {
	// we could use a class
	document.body.classList.add('can-touch');

	// we only need to know once that a human touched the screen, so we can stop listening now
	window.removeEventListener('touchstart', onTouch, false);
}, false);



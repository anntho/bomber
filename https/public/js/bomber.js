/* Copyright 2018, Anthony Pecoraro. All Rights Reserved */

class API {
	constructor(s) {
		this.socket = s;
		this.movies = {};
		this.actors = {};
		this.keyListMovies = [];
		this.keyListActors = [];
		this.valueListMovies = [];
		this.valueListActors = [];
		this.log = false;
	}
	shuffle(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	async reportError() {
		await swal({
			title: 'Whoops!',
			text: 'An error occured.',
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
	async fillStarters() {
		if (this.log) {
			console.log('fillStarters');
		}
		this.socket.emit('starters');
		return new Promise((res, rej) => {
			this.socket.on('starters', async (data) => {
				if (this.log) {
					console.log('starters received');
				}
				this.movies = data.movies;
				this.actors = data.actors;
				this.keyListMovies = this.movies.map(movie => movie.altId);
				this.keyListActors = this.actors.map(actor => actor.altId);
				res();
			});
			this.socket.on('err', () => {
				rej();
			});
		});
	}
	getRandomActorsNoReq(n) {
		let tempArray = [];
		this.shuffle(this.keyListActors);
		for (let i = 0; i < n; i++) {
			let actor = this.actors.find(a => a.altId == this.keyListActors[i])
			tempArray.push(actor.name);
		}
		if (this.log) {
			console.log('getRandomActorsNoReq', n);
		}
		return tempArray;
	}
	getRandomActors(n, id, castIdList) {
		let tempArray = [];
		this.shuffle(this.keyListActors);
		this.keyListActors.forEach((a) => {
			if (!castIdList.includes(parseInt(a)) && tempArray.length < n) {
				let actor = this.actors.find(x => x.altId == a);
				tempArray.push(actor.name);
			}
		});
		if (this.log) {
			console.log('getRandomActors', n, id);
		}
		return tempArray;
	}
	getRandomMoviesNoReq(n) {
		let tempArray = [];
		this.shuffle(this.keyListMovies);
		for (let i = 0; i < n; i++) {
			let movie = this.movies.find(m => m.altId == this.keyListMovies[i])
			tempArray.push(movie.title + ' (' + movie.year + ')');
		}
		if (this.log) {
			console.log('getRandomMoviesNoReq', n);
		}
		return tempArray;
	}
	getRandomMovies(n, id, creditsIdList) {
		let tempArray = [];
		this.shuffle(this.keyListMovies);
		this.keyListMovies.forEach(m => {
			if (!creditsIdList.includes(parseInt(m)) && tempArray.length < n) {
				let movie = this.movies.find(x => x.altId == m);
				tempArray.push(movie.title + ' (' + movie.year + ')');
			}
		});
		if (this.log) {
			console.log('getRandomMovies', n, id);
		}
		return tempArray;
	}
	async getCast(id) {
		if (this.log) {
			console.log('getCast', id);
		}
		this.socket.emit('getCast', id);
		return new Promise((res, rej) => {
			this.socket.on('getCast', async (data) => {
				res(data.cast);
			});
			this.socket.on('err', async () => {
				rej(this.reportError());
			});
		});
	}
	async getCreditsFromActor(id) {
		if (this.log) {
			console.log('getCreditsFromActor', id);
		}
		this.socket.emit('getCredits', id);
		return new Promise((res, rej) => {
			this.socket.on('getCredits', async (data) => {
				res(data.cast);
			});
			this.socket.on('err', async () => {
				rej(this.reportError());
			});
		});
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
		this.loader = document.getElementById('faceLoader');
		this.face = document.getElementById('face');
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
		this.face.style.display = 'none';
		this.loader.style.display = 'block';
	}
	loaderOff() {
		this.prompts.forEach(prompt => {
			prompt.style.display = 'flex'
		});
		this.face.style.display = 'block';
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
		this.usedActors = [];
		this.usedMovies = [];
		this.crazy = false;
		this.package = [];
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
	constructor(a, b, c, d, e, f, g) {
		this.api = a;
		this.dom = b;
		this.ref = c;
		this.user = d;
		this.socket = e;
		this.username = f;
		this.userId = g;
		this.start = true;
		this.log = false;
	}
	brackets(str) {
		return `${str}`;
	}
	async pauser(ms) {
		return new Promise(r => setTimeout(r, ms));
	}
	async mainUserGuessActor() {
		if (this.log) {
			console.log('mainUserGuessActor');
		}
		let random = 0;
		let credits = [];
		let cast = [];
		let freeMovies = [];
		let freeActors = [];
		let castIds = [];
		let movie = {};
		let actor = {};

		// get credits from actor
		credits = await this.api.getCreditsFromActor(this.ref.id);
		credits.sort((a, b) => b.vote_count-a.vote_count);

		if (this.ref.crazy) {
			this.api.shuffle(credits);
		}

		// find unused movie
		credits.forEach((creditObj, index) => {
			if (!this.ref.usedMovies.find(x => x.id === creditObj.id)) {
				freeMovies.push(index);
			}
		});
		movie = {id: credits[freeMovies[0]].id, title: credits[freeMovies[0]].title + ' (' + credits[freeMovies[0]].release_date.substring(0, 4) + ')'}

		// get cast from movie
		cast = await this.api.getCast(movie.id);

		// find unused actor from cast and create id list
		cast.forEach((castObj, index) => {
			castIds.push(castObj.id);
			if (!this.ref.usedActors.find(x => x.id === castObj.id)) {
				freeActors.push(index);
			}
		});

		if (freeActors.length > 4) {
			random = Math.floor(Math.random()*4);
			actor = {id: cast[freeActors[random]].id, name: cast[freeActors[random]].name}
		} else {
			actor = {id: cast[freeActors[0]].id, name: cast[freeActors[0]].name}
		}

		this.dom.setDialouge(
			this.brackets(this.ref.name) + ' was also in ' + this.brackets(movie.title),
			'Can you name another actor in ' + this.brackets(movie.title) + '?'
		);
		
		this.ref.usedMovies.push(movie);
		this.ref.usedActors.push(actor);
		this.ref.prev = movie.title;

		await this.setBtnsActor(actor.name, actor.id, castIds);

		if (this.log) {
			console.log('mainUserGuessActor');
			console.log(this.ref);
		}
	}
	async mainUserGuessMovie() {
		if (this.log) {
			console.log('mainUserGuessMovie');
		}
		let random = 0;
		let cast = [];
		let credits = [];
		let freeActors = [];
		let freeMovies = [];
		let creditsIds = [];
		let actor = {};
		let movie = {};

		// find actor in cast
		cast = await this.api.getCast(this.ref.id);
		cast.forEach((castObj, index) => {
			if (!this.ref.usedActors.find(x => x.id === castObj.id)) {
				freeActors.push(index);
			}
		});
		actor = {id: cast[freeActors[0]].id, name: cast[freeActors[0]].name}

		// get actor's credits
		credits = await this.api.getCreditsFromActor(actor.id);
		credits.sort((a, b) => b.vote_count-a.vote_count);

		if (this.ref.crazy) {
			this.api.shuffle(credits);
		}

		// get movie from actor credits and create id list
		credits.forEach((creditObj, index) => {
			creditsIds.push(creditObj.id);
			if (!this.ref.usedMovies.find(x => x.id === creditObj.id)) {
				freeMovies.push(index);
			}
		});

		if (freeMovies.length > 4) {
			random = Math.floor(Math.random()*4);
			movie = {id: credits[freeMovies[random]].id, title: credits[freeMovies[random]].title + ' (' + credits[freeMovies[random]].release_date.substring(0, 4) + ')'}
		} else {
			movie = {id: credits[freeMovies[0]].id, title: credits[freeMovies[0]].title + ' (' + credits[freeMovies[0]].release_date.substring(0, 4) + ')'}
		}

		this.dom.setDialouge(
			this.brackets(actor.name) + ' was also in ' + this.brackets(this.ref.name),
			'Can you guess another movie ' + this.brackets(actor.name) + ' was in?'
		);

		this.ref.usedActors.push(actor);
		this.ref.usedMovies.push(movie);
		this.ref.prev = actor.name;

		await this.setBtnsMovie(movie.title, movie.id, creditsIds);

		if (this.log) {
			console.log('mainUserGuessMovie');
			console.log(this.ref);
		}
	}
	async switchToActors(actorName) {
		if (this.log) {
			console.log('switchToActors', actorName);
		}
		let pos = 0;
		let ipActor = {};
		let credits = [];
		let credit = {};
		let cast = [];
		let castIds = [];
		let movie = {};
		let actor = {};
		let exclusions = [];

		// get credits from actor
		ipActor = this.api.actors.find(actor => actor.name === actorName);
		credits = await this.api.getCreditsFromActor(ipActor.altId);
		credits.sort((a, b) => b.vote_count-a.vote_count);
		
		// get movie from actor's credits
		if (this.ref.crazy) {
			credit = credits[Math.floor(Math.random()*credits.length)];
		} else {
			credit = credits[0];
		}

		movie = {id: credit.id, title: credit.title + ' (' + credit.release_date.substring(0, 4) + ')'}

		// get movie cast
		cast = await this.api.getCast(movie.id);

		// remove target from cast
		pos = cast.map(x => x.id).indexOf(ipActor.altId);
		cast.splice(pos, 1);
		castIds = cast.map(x => x.id);

		// create exclusions
		exclusions = castIds.slice();
		exclusions.push(ipActor.altId);

		// get actor from cast
		actor = {id: cast[0].id, name: cast[0].name}

		this.ref.usedActors.push(actor);
		this.ref.usedMovies.push(movie);
		this.ref.prev = movie.title;

		this.dom.setDialouge(
			this.brackets(actorName) + ' was in ' + this.brackets(movie.title),
			'Can you name another actor in ' + this.brackets(movie.title) + '?'
		);

		await this.setBtnsActor(actor.name, actor.id, exclusions);

		if (this.log) {
			console.log('switchToActors');
			console.log(this.ref);
		}
	}
	async switchToMovies(movieTitle) {
		if (this.log) {
			console.log('switchToMovies', movieTitle);
		}
		if (this.start) {
			this.socket.emit('game', {
				score: null,
				event: 'start',
				mode: 'bomber',
				participants: 1,
				sid: null
			});
			this.start = false;
		}
		let pos = 0;
		let ipMovie = {};
		let actor = {};
		let movie = {};
		let credit = {};
		let cast = [];
		let credits = [];
		let creditsIds = [];
		let exclusions = [];

		// get movie and cast from input
		ipMovie = this.api.movies.find(m => (m.title + ' (' + m.year + ')') == movieTitle); // update logic to use data attribute instead of string match

		cast = await this.api.getCast(ipMovie.altId);
		
		// select actor from cast
		actor = {id: cast[0].id, name: cast[0].name}

		// get credits from actor
		credits = await this.api.getCreditsFromActor(actor.id);

		// remove target movie from credits
		pos = credits.map(x => x.id).indexOf(ipMovie.altId);
		credits.splice(pos, 1);
		credits.forEach((x) => creditsIds.push(x.id));

		// create list of movies to exclude from random choices
		exclusions = creditsIds.slice();
		exclusions.push(ipMovie.altId);

		// sort credits by votes
		credits.sort((a, b) => b.vote_count-a.vote_count);

		// get movie from credits
		if (this.ref.crazy) {
			credit = credits[Math.floor(Math.random()*credits.length)];
		} else {
			credit = credits[0];
		}

		movie = {id: credit.id, title: credit.title + ' (' + credit.release_date.substring(0, 4) + ')'}

		this.ref.usedActors.push(actor);
		this.ref.usedMovies.push(movie);
		this.ref.prev = actor.name;

		this.dom.setDialouge(
			this.brackets(actor.name) + ' was in ' + this.brackets(movieTitle),
			'Can you guess another movie that ' + this.brackets(actor.name) + ' was in?'
		);

		await this.setBtnsMovie(movie.title, movie.id, exclusions);

		if (this.log) {
			console.log('switchToMovies');
			console.log(this.ref);
		}
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

		if (this.log) {
			console.log('userPickActor');
			console.log(this.ref);
		}
	}
	async userPickMovie(start) {
		let movies = this.api.getRandomMoviesNoReq(4);
		let msgA = 'Send it back by picking a movie from the list below.';
		let msgB = '';
		if (start) {
			msgA = `Let's play movie bomber!`;
			msgB = 'You can start it off by picking a movie from the list below.'
		}

		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = movies[key];
		});
		this.dom.setDialouge(msgA, msgB);

		this.ref.clearBigFour();
		this.ref.type = 'movie';
		this.ref.reset = true;

		if (this.log) {
			console.log('userPickMovie');
			console.log(this.ref);
		}
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
		let randomMovies = await this.api.getRandomMovies(3, id, credits);
		randomMovies.push(title);
		this.api.shuffle(randomMovies);
		this.ref.setBigFour(title, id, 'movie', false);
		this.dom.buttons.forEach((btn, key) => {
			btn.textContent = randomMovies[key];
		});
	}
	async eventDriver(userInput) {
		if (this.ref.reset === true) {
			if (this.log) {
				console.log('reset: true');
			}
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
			this.ref.package.push({
				t: (this.ref.type === 'movie') ? 'm' : 'a',
				f: this.ref.prev,
				a: this.ref.name,
				s: this.user.score,
				r: 1
			});

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

			this.ref.package.push({
				t: (this.ref.type === 'movie') ? 'm' : 'a',
				f: this.ref.prev,
				a: this.ref.name,
				s: this.user.score,
				r: -1
			});

			if (this.user.lives < 5) { //testing
				this.user.lives = 0;
				console.log('test mode is on')
			}

			if (this.user.lives < 1) {
				this.dom.hideGamebox();

				await swal({
					title: 'Game Over',
					closeOnClickOutside: false
				});

				this.socket.emit('game', {
					score: this.user.score,
					event: 'end',
					mode: 'bomber',
					participants: 1,
					sid: this.sid || null,
					package: this.ref.package
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
	console.log('socket connected');

	let mrAPI = new API(socket);
	let mrDom = new DOMElements();
	let mrRef = new Reference();
	let mrUser = new User();
	let mrBomber = new GameLogic(
		mrAPI, 
		mrDom, 
		mrRef, 
		mrUser, 
		socket, 
		usernameString, 
		userIdString
	);
	
	socket.on('game', function(data) {
		if (!mrBomber.sid) {
			mrBomber.sid = data;
		}
	});

	await mrAPI.fillStarters();
	await mrBomber.userPickMovie(true);

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
	});
});

window.addEventListener('touchstart', function onTouch() {
	// we could use a class
	document.body.classList.add('can-touch');

	// we only need to know once that a human touched the screen, so we can stop listening now
	window.removeEventListener('touchstart', onTouch, false);
}, false);



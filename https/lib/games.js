const mysql = require('mysql');
const config = require('../bin/config');
const gamesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { shuffle } = require('./helpers');
const { Game, Movie } = require('../models/models');
const { reportError } = require('./errors');
const cryptoRandomString = require('crypto-random-string');

const line = '---------------------------------';
const file = 'lib/games.js';

module.exports = {
    saveGame: async (data, socket) => {
		console.log('Game data:');
		console.log(data);
		console.log(line);

		let userId = null;

		if (socket.request.session &&
			socket.request.session.user) {
			console.log(socket.request.session.user.username);
			console.log(line);
			userId = socket.request.session.user.id;
		} else {
			return false;
		}

		try {
			if (!data.sid && data.event === 'start') {
				let sid = randomString({length: 32});
				let proc = 'CALL sp_InsertGame(?, ?, ?, ?, ?, ?)';
				let inputs = [sid, userId, data.score, data.event, data.mode, data.participants];
				let results = await procHandler(gamesPool, proc, inputs);
				let newRowId = results[0].newRowId;
				if (newRowId) {
					socket.emit('game', sid);
				}
			} else if (data.sid && data.event === 'end') {
				let updateProc = 'CALL sp_UpdateGame(?, ?, ?)';
				let updateInputs = [data.sid, data.event, data.score];
				await procHandler(gamesPool, updateProc, updateInputs);

				if (data.package) {
					let insertProc = 'CALL sp_InsertPackage(?, ?)';
					let uglyPackage = JSON.stringify(data.package);
					let insertInputs = [data.sid, uglyPackage];
					await procHandler(gamesPool, insertProc, insertInputs);
					socket.emit('complete');
				}
			} else {
				socket.emit('err');
			}
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	},
	// ===================================================
	// Live Games
	// ===================================================
	cancel: async (socket) => {
		if (socket.request.session.game) {
			try {
				let game = socket.request.session.game;
				if (game.status == 'open') {
					await Game.deleteOne({room: game.room});
					socket.request.session.game = null;
					socket.request.session.save();
					socket.emit('stopSearch', {
						error: false, 
						message: 'success'
					});
				} else {
					socket.emit('stopSearch', {
						error: true, 
						message: 'no open games found'
					});
				}
			} catch (err) {
				console.log(err);
				return socket.emit('err', err);
			}
		}
	},
	close: async (socket) => {
		if (socket.request.session.game.room) {
			try {
				let game = socket.request.session.game;
				await Game.deleteOne({room: game.room});
				socket.request.session.game = null;
				socket.request.session.save();
			} catch (err) {
				console.log(err);
			}
		}
	},
	update: async (data, socket) => {
		if (socket.request.session.game.room) {
			// 1. Update the user's socket id
			try {
				let room = socket.request.session.game.room;
				let user = socket.request.session.user;
				let game = await Game.findOne({room: room});
				let userData = game.players.find(p => p.userId == user.id);
				userData.socketId = socket.id;
				game.save();
				
				let u = game.players.find(p => p.userId == user.id);
				let opp = game.players.find(p => p.userId != user.id);

				socket.join(room); // re-join room
				socket.emit('update', {
					user: user,
					u: u,
					opp: opp,
					game: game
				});
			} catch (err) {
				console.log(err);
				return socket.emit('err', err);
			}
		}
	},
	find: async (io, socket) => {
		if (!socket.request.session.user) {
			return socket.emit('liveCheckUser', false);
		} else {
			socket.emit('liveCheckUser', true);
		}

		try {
			let username = socket.request.session.user.username;
			let userId = socket.request.session.user.id;
			let rank = socket.request.session.user.rank;
			let level = socket.request.session.user.level;
			let defaultListId = '109087';

			// 1. Find an open game
			let open = await Game.findOne({status: 'open'});
			
			// 2. If no open games, create one and wait in new room
			if (!open) {
				console.log('No open games found..creating one');
				let roomId = cryptoRandomString({length: 10});
				let list = await Movie.find({listID: defaultListId});
				let idList = [];

				for (const i of list) {
					idList.push({
						id: i.altId,
						winner: null
					});
				}
				
				shuffle(idList);

				let newGame = {
					room: roomId,
					status: 'open',
					time: 60, //seconds
					index: 0,
					cIndex: Math.floor(Math.random() * 3),
					players: [{
						username: username,
						userId: userId,
						socketId: socket.id,
						rank: rank,
						level: level,
						score: 0
					}],
					list: idList
				}

				let doc = new Game(newGame);
				await doc.save();

				socket.join(roomId);
				socket.request.session.game = newGame;
				socket.request.session.save(function(err) {
					if (err) {
						return socket.emit('err', err);
					}
				});
			} else {
				// 3. Join open game
				console.log('Joining open game');
				open.status = 'active';
				open.players.push({
					username: username,
					userId: userId,
					socketId: socket.id,
					rank: rank,
					level: level,
					score: 0
				});
				open.save();

				socket.join(open.room);
				socket.request.session.game = open;
				socket.request.session.save(function(err) {
					if (err) {
						console.log('err saving session');
						return socket.emit('err', err);
					}
				});

				console.log(open.room, open.idList, open.cIndex)

				io.to(open.room).emit('connected', {
					room: open.room
				});
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	guess: async (data, io, socket) => {
		console.log('guess');
		console.log(data);
		try {
			let userId = socket.request.session.user.id;
			let room = socket.request.session.game.room;
			let game = await Game.findOne({room: room});
			let movie = game.list.find(m => m.id == data.id);
			
			if (movie && !movie.winner) {
				let advance = true;
				let bothWrong = false;
				let gameover = false;
				
				movie.guesses.push(userId);
				game.index = game.index + 1;

				let u = game.players.find(p => p.userId == userId);
				let o = game.players.find(p => p.userId != userId);

				if (data.correct) {
					movie.winner = userId;
					u.score = u.score + 10;

					if (u.score == 100) {
						gameover = true;
						game.status = 'closed';
					}

					// Emit to Winner
					socket.emit('win', {
						uscore: u.score,
						oscore: o.score,
						gameover: gameover
					});

					// Emit to loser
					io.to(o.socketId).emit('lose', {
						uscore: u.score,
						oscore: o.score,
						gameover: gameover
					});
				} else {
					if (movie.guesses.length >= 2) {
						bothWrong = true;
					} else {
						advance = false;
					}
				}

				game.save();

				// Emit to room
				if (advance) {
					console.log('advance');
					io.to(room).emit('advance', {
						index: game.index,
						bothWrong: bothWrong,
					});
				}
			} else {
				console.log('Not a winner');
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	}
}
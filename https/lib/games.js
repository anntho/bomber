const mysql = require('mysql');
const config = require('../bin/config');
const gamesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { Game } = require('../models/models');
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
					let doc = await Game.findOne({room: game.room});
					doc.status = 'aborted';
					doc.save();
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
	update: async (socket) => {
		if (socket.request.session.room) {
			// 1. Update the user's socket id
			try {
				let room = socket.request.session.room;
				let userId = socket.request.session.user.id;
				let game = await Game.findOne({room: room});
				if (game) {
					let userData = game.players.find(p => p.userId == userId);
					console.log('old id', userData.socketId);
					console.log('new id', socket.id);
					userData.socketId = socket.id;
					game.save();
				}
				socket.emit('update');
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
			console.log('game request', username);

			// 1. Find an open game
			let open = await Game.findOne({status: 'open'});
			
			// 2. If no open games, create one and wait in new room
			if (!open) {
				console.log('no open games found');
				let roomId = cryptoRandomString({length: 10});
				let newGame = {
					room: roomId,
					status: 'open',
					players: [{
						username: username,
						userId: userId,
						socketId: socket.id
					}]
				}

				let doc = new Game(newGame);
				let response = await doc.save();

				console.log(response);

				socket.join(roomId);
				socket.request.session.game = newGame;
				socket.request.session.save(function(err) {
					if (err) {
						return socket.emit('err', err);
					}
				});
			} else {
				// 3. Join open game
				console.log('joining open game');
				open.status = 'active';
				open.players.push({
					username: username,
					userId: userId,
					socketId: socket.id
				});
				open.save();

				socket.join(open.room);
				socket.request.session.game = open;
				socket.request.session.save(function(err) {
					if (err) {
						return socket.emit('err', err);
					}
				});
				io.to(open.room).emit('connected', {
					room: open.room
				});
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	fire: async (data, socket) => {
		let game = games.find(g => g.room == data.room);
		let opponent = game.players.find(p => p.username != socket.request.session.user);
		//console.log('opponent', opponent)
		socket.broadcast.to(opponent.socketId).emit('msg', 'boop');
		socket.emit('msg', 'beep');
		io.to(data.room).emit('gameover');
	}
}

let games = [];
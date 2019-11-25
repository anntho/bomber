const mysql = require('mysql');
const config = require('../bin/config');
const gamesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { shuffle } = require('./helpers');
const { Game, Round } = require('../models/models');
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
				
				let opponent = game.players.find(p => p.userId != user.id);

				socket.emit('update', {
					username: user.username,
					rank: user.rank,
					level: user.level,
					opponentUsername: opponent.username,
					opponentRank: opponent.rank,
					opponentLevel: opponent.level
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
				console.log('no open games found');
				let roomId = cryptoRandomString({length: 10});
				let newGame = {
					room: roomId,
					status: 'open',
					players: [{
						username: username,
						userId: userId,
						socketId: socket.id,
						rank: rank,
						level: level
					}]
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
				let list = await Round.find({listID: defaultListId});
				let idList = list.map(x => x._id);
				shuffle(idList);
				let cIndex = Math.floor(Math.random() * 3); // Determine the index of the correct answer to use
				
				open.status = 'active';
				open.players.push({
					username: username,
					userId: userId,
					socketId: socket.id,
					rank: rank,
					level: level
				});
				open.index = 0;
				open.cIndex = cIndex;
				open.list = idList;
				open.save();

				socket.join(open.room);
				socket.request.session.game = open;
				socket.request.session.save(function(err) {
					if (err) {
						return socket.emit('err', err);
					}
				});
				io.to(open.room).emit('connected', {
					room: open.room,
					idList: idList,
					cIndex: cIndex
				});
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	fire: async (data, io, socket) => {
		try {
			let userId = socket.request.session.user.id;
			let room = socket.request.session.game.room;
			let game = await Game.findOne({room: room});
			let opponent = game.players.find(p => p.userId != userId);
			
			socket.emit('fire', 'you win');
			io.to(opponent.socketId).emit('fire', 'you lose');

			// socket.broadcast.to(opponent.socketId).emit('msg', 'boop');
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	}
}
const mysql = require('mysql');
const config = require('../bin/config');
const gamesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/games.js';

module.exports = {
    findGame: async (data, socket) => {
		let username = '';

		if (!socket.request.session.user) {
			socket.emit('error', 'not logged in');
		} else {
			username = socket.request.session.user.username;
			let activeMatch = await Match.findOne({players: username, status: 1});
			if (activeMatch) {
				socket.emit('error', 'already in match');
			} else {
				try {
					let match = await Match.findOne({status: 0});
					if (!match) {
						socket.emit('info', 'no matches to join -- creating one');
						let room = randomString({length: 8});
						const newMatch = new Match({
							status: 0,
							room: room,
							players: [data.user.username],
							sockets: [socket.id]
						});

						try {
							await newMatch.save();
							socket.join(room, () => {
								io.to(room).emit('joined', room);
							});
						} catch (err) {
							socket.emit('error', err);
						}
					} else {
						console.log('Found Match');
						console.log(match);
						console.log(line);

						match.players.push(username);
						match.sockets.push(socket.id);
						match.status = 1;

						try {
							await match.save();
							socket.join(match.room);
							io.to(match.room).emit('matched', match.room);
						} catch (err) {
							socket.emit('error', err);
						}
					}
				} catch (err) {
					reportError(process.env, file, '61', err, true);
				}
			}
		}
    },
    createGame: async (socket) => {
		if (socket.request.session.user) {
			let username = socket.request.session.user.username;
			
			let match = await Match.findOne({ 
				status: 1, players: username
			}).sort({date: 'desc'}).exec();

			if (match) {
				let index = match.players.indexOf(username);
				match.sockets.set(index, socket.id);
				
				try {
					await match.save();
					socket.join(match.room, () => {
						io.to(match.room).emit('re-joined', match.room);
					});
				} catch (err) {
					socket.emit('error', err);
				}
			}
		}
    },
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
				let results = await procHandler(socketPool, proc, inputs);
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
    }
}
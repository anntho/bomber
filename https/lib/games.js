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
	lobby: async (data, socket) => {
		try {
			let games = await Game.find({status: 'open'});
			let expires = 300000;
			let now = new Date();
			let timeNow = now.getTime();

			if (games) {
				for (const game of games) {
					let timestamp = game._id.getTimestamp();
					let date = new Date(timestamp);
					let timeGame = date.getTime();
					let diff = timeNow - timeGame;
	
					if (diff > expires) { // 5 min
						game.status = 'expired';
						game.save();
					}
				}
				let openGames = games.filter(g => g.status == 'open');
				socket.emit('lobby', openGames);
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	cancel: async (socket) => {
		if (socket.request.session.game) {
			try {
				let game = socket.request.session.game;
				if (game.status == 'open') {
					socket.emit('removeFromLobby', {
						room: game.room
					});
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
	update: async (socket) => {
		if (socket.request.session.game.room) {
			// 1. Update the user's socket id
			try {
				let room = socket.request.session.game.room;
				let user = socket.request.session.user;
				let game = await Game.findOne({room: room});

				let userData = game.players.find(p => p.userId == user.id);
				let opponentData = game.players.find(p => p.userId != user.id);

				let userElo = await getElo(userData.userId);
				let opponentElo = await getElo(opponentData.userId);

				userData.elo = userElo[0].elo;
				opponentData.elo = opponentElo[0].elo;

				userData.socketId = socket.id;
				game.save();
				
				let reUserData = game.players.find(p => p.userId == userData.userId);
				let reOpponentData = game.players.find(p => p.userId == opponentData.userId);

				socket.join(room); // re-join room
				socket.emit('update', {
					user: user,
					userData: reUserData,
					opponentData: reOpponentData,
					game: game
				});
			} catch (err) {
				console.log(err);
				return socket.emit('err', err);
			}
		}
	},
	joinById: async (io, socket, data) => {
		console.log('joinById');
		try {
			if (!socket.request.session.user) {
				return socket.emit('liveCheckUser', false);
			}

			let username = socket.request.session.user.username;
			let userId = socket.request.session.user.id;
			let rank = socket.request.session.user.rank;
			let elo = socket.request.session.user.elo;

			let game = await Game.findOne({room: data.room});
			
			if (game && game.status == 'open') {
				console.log('game found')
				game.status = 'active';
				game.players.push({
					username: username,
					userId: userId,
					socketId: socket.id,
					rank: rank,
					elo: elo,
					score: 0
				});
				game.save();
	
				socket.join(game.room);
				socket.request.session.game = game;
				socket.request.session.save(function(err) {
					if (err) {
						return socket.emit('err', err);
					}
				});

				io.to(game.room).emit('connected', {
					room: game.room
				});
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	search: async (io, socket, data) => {
		console.log('game search')
		console.log(data)
		if (!socket.request.session.user) {
			return socket.emit('liveCheckUser', false);
		} else {
			socket.emit('liveCheckUser', true);
		}

		try {
			let username = socket.request.session.user.username;
			let userId = socket.request.session.user.id;
			let rank = socket.request.session.user.rank;
			let elo = socket.request.session.user.elo;
			let mode = data.mode;
			let count = data.count;
			let listId = '';

			console.log('variables: ', mode, count)

			// 1. Find an open game w/matching params
			let open = await Game.findOne({ 
				'status': 'open',
				'parameters.mode': mode,
				'parameters.count': count
			});
			
			// 2. If no open games, create one and wait in new room
			if (!open) {
				let roomId = cryptoRandomString({length: 10});
				
				switch (mode) {
					case 'popular':
						listId = '96725';
						break;
					case 'horror':
						listId = '127700';
						break;
				}

				let idList = [];
				let list = await Movie.find({'lists.altId': listId});
				idList = list.map(i => i.altId);
				shuffle(idList);
				idList = idList.slice(0, 50); // don't store hundreds of ids

				let newGame = {
					room: roomId,
					status: 'open',
					parameters: {
						mode: String(mode),
						count: parseInt(count),
						listId: String(listId)
					},
					winner: null,
					index: 0,
					cIndex: Math.floor(Math.random() * 3),
					players: [{
						username: username,
						userId: userId,
						socketId: socket.id,
						rank: rank,
						elo: elo,
						score: 0,
						new: null
					}],
					list: idList,
					// add first ID to turns arr
					turns: [
						{
							id: idList[0],
							guesses: {
								correct: null,
								incorrect: []
							}
						}
					]
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
				let myGame = open.players.find(p => p.userId == userId);
				if (!myGame) {
					// 3. Join open game
					console.log('Joining open game');
					open.status = 'active';
					open.players.push({
						username: username,
						userId: userId,
						socketId: socket.id,
						rank: rank,
						elo: elo,
						score: 0,
						new: null
					});
					open.save();

					socket.join(open.room);
					socket.request.session.game = open;
					socket.request.session.save(function(err) {
						if (err) {
							//console.log('err saving session');
							return socket.emit('err', err);
						}
					});

					socket.emit('removeFromLobby', {
						room: open.room
					});

					io.to(open.room).emit('connected', {
						room: open.room
					});
				}
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	},
	guess: async (io, socket, data) => {
		//console.log('guess');
		//console.log(data);
		try {
			let userId = socket.request.session.user.id;
			let room = socket.request.session.game.room;
			let game = await Game.findOne({room: room});
			let turn = game.turns.find(t => t.id == data.id);
			let gameUser = game.players.find(p => p.userId == userId);
			let gameOpponent = game.players.find(p => p.userId != userId);

			let advance = true;
			let bothWrong = false;
			let gameover = false;

			if (!turn) {
				game.turns.push({ id: data.id });
				turn = game.turns.find(t => t.id == data.id);
			}

			if (data.correct) {
				if (!turn.guesses.correct) {
					turn.guesses.correct = userId;
					gameUser.score = gameUser.score + 1;

					if (gameUser.score === game.parameters.count) {
						game.status = 'closed';
						game.winner = userId;
						gameover = true;

						// should probably also check ..
						// rank level up (games played)

						let eloData = await updateElo(
							parseInt(userId),
							parseInt(gameOpponent.userId)
						);

						gameUser.new.elo = eloData[0].userElo;
						gameUser.new.points = eloData[0].userPoints;
						gameOpponent.new.elo = eloData[0].opponentElo;
						gameOpponent.new.points = eloData[0].opponentPoints;

						socket.emit('winner', {
							elo: {
								elo: eloData[0].userElo,
								points: eloData[0].userPoints
							},
							opponentElo: {
								elo: eloData[0].opponentElo,
								points: eloData[0].opponentPoints,
							}
						});

						io.to(gameOpponent.socketId).emit('loser', {
							elo: {
								elo: eloData[0].opponentElo,
								points: eloData[0].opponentPoints,
							},
							opponentElo: {
								elo: eloData[0].userElo,
								points: eloData[0].userPoints
							}
						});
					}
				}

				socket.emit('win', {
					userScore: gameUser.score,
					opponentScore: gameOpponent.score
				});

				io.to(gameOpponent.socketId).emit('lose', {
					userScore: gameOpponent.score,
					opponentScore: gameUser.score
				});
			} else {
				console.log('incorrect');
				turn.guesses.incorrect.push(userId);
				console.log(turn.guesses.incorrect);
				if (turn.guesses.incorrect.length > 1) {
					bothWrong = true;
				} else {
					advance = false;
				}
				socket.emit('wrong');
			}

			if (!gameover) game.index = game.index + 1;
			game.save();

			if (gameover) {
				io.to(room).emit('gameover', {
					turns: game.turns,
					winner: userId,
					ids: [gameUser.userId, gameOpponent.userId]
				});
			} else {
				if (advance) {
					io.to(room).emit('advance', {
						index: game.index,
						bothWrong: bothWrong
					});
				}
			}
		} catch (err) {
			console.log(err);
			return socket.emit('err', err);
		}
	}
}

async function updateElo(userId, opponentId) {
	try {
		let proc = 'CALL sp_UpdateElo(?, ?)';
		let inputs = [userId, opponentId];
		let data = await procHandler(gamesPool, proc, inputs);
		return data;
	} catch (err) {
		throw err;
	}
}

async function getElo(userId) {
	try {
		let proc = 'CALL sp_GetUserElo(?)';
		let inputs = [userId];
		let data = await procHandler(gamesPool, proc, inputs);
		return data;
	} catch (err) {
		throw err;
	}
}
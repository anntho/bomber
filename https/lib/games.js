const mysql = require('mysql');
const config = require('../bin/config');
const gamesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { shuffle } = require('./helpers');
const { getSockets } = require('./users');
const { Game, Movie } = require('../models/models');
const { reportError } = require('./errors');
const cryptoRandomString = require('crypto-random-string');

const file = 'lib/games.js';
const env = process.env.NODE_ENV || 'development';

module.exports = {
	checkExpired: async (game) => {
		let expired = false;
		let expiration = config.games.expiration;
		let now = new Date();
		let timeNow = now.getTime();
		let timestamp = game._id.getTimestamp();
		let date = new Date(timestamp);
		let timeGame = date.getTime();
		let diff = timeNow - timeGame;

		if (diff > expiration) {
			await game.deleteOne({room: game.room}).exec();
		}
		return expired;
	},
	lobby: async (data, socket) => {
		try {
			let games = await Game.find({
				status: 'open',
				env: env,
				type: 'search'
			});
			if (games) {
				for (const game of games) {
					await module.exports.checkExpired(game);
				}
				let openGames = games.filter(g => g.status == 'open');
				socket.emit('lobby', openGames);
			}
		} catch (err) {
			reportError(file, '40', err, false);
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
				reportError(file, '66', err, false);
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
				reportError(file, '79', err, true);
				return socket.emit('err', err);
			}
		}
	},
	resign: async (io, socket, data) => {
		if (socket.request.session.game.room) {
			try {
				let room = socket.request.session.game.room;
				let user = socket.request.session.user;
				let game = await Game.findOne({room: room});

				let userData = game.players.find(p => p.userId == user.id);
				let opponentData = game.players.find(p => p.userId != user.id);

				await endGame(io, game, opponentData, userData, true);

				socket.request.session.game = null;
				socket.request.session.save();
			} catch (err) {
				reportError(file, '99', err, false);
				return socket.emit('err', err);
			}
		}
	},
	update: async (socket) => {
		if (socket.request.session.game.room) {
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
				reportError(file, '134', err, true);
				return socket.emit('err', err);
			}
		}
	},
	joinById: async (io, socket, data) => {
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
			reportError(file, '177', err, true);
			return socket.emit('err', err);
		}
	},
	accept: async (io, socket, data) => {
		console.log('accept')
		console.log(data)
		if (socket.request.session.user) {
			try {
				let username = socket.request.session.user.username;
				let userId = socket.request.session.user.id;
				let rank = socket.request.session.user.rank;
				let elo = socket.request.session.user.elo;
	
				let game = await Game.findOne({room: data.roomId});
				
				if (game && game.status == 'open') {
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
				reportError(file, '222', err, false);
				return socket.emit('err', err);
			}
		}
	},
	challenge: async (io, socket, data) => {
		if (socket.request.session.user) {
			try {
				let user = socket.request.session.user;
				let mode = data.mode;
				let count = data.count;
				let listId = getListId(mode);
				if (!socket.request.session.user.game) {
					let roomId = cryptoRandomString({length: 10});
					let idList = await makeIdList(listId);
					let participants = { 
						toId: data.userId,
						toUsername: data.username,
						fromId: user.id,
						fromUsername: user.username
					};
					let newGame = createNewGame(socket, 'challenge', participants, roomId, mode, count, listId, idList);
					let doc = new Game(newGame);
					await doc.save();
					saveToSocket(socket, newGame);
					socket.emit('challenge:created');
					let sockets = await getSockets(data.userId);
					if (sockets && sockets.length) {
						sendChallenge(io, sockets, roomId, data.username);
					}
				}
			} catch (err) {
				reportError(file, '185', err, false);
				return socket.emit('err', err);
			}
		}
	},
	search: async (io, socket, data) => {
		try {
			if (!socket.request.session.user) {
				return socket.emit('liveCheckUser', false);
			} else {
				socket.emit('liveCheckUser', true);
			}
			console.log(`searching for a game in ${env}`);
			let userId = socket.request.session.user.id;
			let mode = data.mode;
			let count = data.count;
			let listId = getListId(mode);
			let open = await findOpenGame(env, mode, count);

			if (!open) {
				console.log(`creating new game in ${env}`);
				let roomId = cryptoRandomString({length: 10});
				let idList = await makeIdList(listId);
				let newGame = createNewGame(socket, 'search', null, roomId, mode, count, listId, idList);
				let doc = new Game(newGame);
				await doc.save();
				saveToSocket(socket, newGame);

			} else {
				console.log(`joining new game in ${env}`);
				let myGame = open.players.find(p => p.userId == userId);
				if (!myGame) {
					//console.log('joining a game')
					await joinGame(socket, open);
					saveToSocket(socket, open);

					socket.emit('removeFromLobby', {
						room: open.room
					});

					io.to(open.room).emit('connected', {
						room: open.room
					});
				}
			}
		} catch (err) {
			reportError(file, '229', err, false);
			return socket.emit('err', err);
		}
	},
	guess: async (io, socket, data) => {
		try {
			let userId = socket.request.session.user.id;
			let room = socket.request.session.game.room;
			let game = await Game.findOne({room: room});
			let turn = game.turns.find(t => t.id == data.id);
			let gameUser = game.players.find(p => p.userId == userId);
			let gameOpponent = game.players.find(p => p.userId != userId);

			if (!turn) {
				game.turns.push({id: data.id});
				turn = game.turns.find(t => t.id == data.id);
			}

			if (data.correct) {
				if (!turn.guesses.correct) {
					turn.guesses.correct = userId;
					gameUser.score++;
					emitGuessResponse(io, gameUser, gameOpponent, game.parameters.count);
					if (gameUser.score === game.parameters.count) {
						gameover = true;
						await endGame(io, game, gameUser, gameOpponent, false);
					} else {
						await advance(io, game, false);
					}
				}
			} else {
				turn.guesses.incorrect.push(userId);
				turn.detail = 'both_wrong';
				await game.save();
				if (turn.guesses.incorrect.length > 1) {
					await advance(io, game, true);
				}
			}
		} catch (err) {
			reportError(file, '268', err, false);
			return socket.emit('err', err);
		}
	}
}

function getListId(mode) {
	let listId = null;
	switch (mode) {
		case 'popular':
			listId = '96725';
			break;
		case 'horror':
			listId = '127700';
			break;
		case '90s':
			listId = '84651';
			break;
	}
	return listId;
}

async function findOpenGame(env, mode, count) {
	if (mode && count) {
		return await Game.findOne({
			'status': 'open',
			'env': env,
			'type': 'search',
			'parameters.mode': mode,
			'parameters.count': count
		});
	} else {
		return await Game.findOne({
			'status': 'open',
			'env': env,
			'type': 'search'
		});
	}
}

async function makeIdList(listId) {
	let list = await Movie.find({'lists.altId': listId});
	let idList = list.map(i => i.altId);
	shuffle(idList);
	return idList.slice(0, 50);
}

function createNewGame(socket, type, challenge, roomId, mode, count, listId, idList) {
	let user = socket.request.session.user;
	return {
		room: roomId,
		env: env,
		status: 'open',
		type: type,
		challenge: challenge,
		parameters: {
			mode: String(mode),
			count: parseInt(count),
			listId: String(listId)
		},
		outcome: {
			winner: null,
			outcome: null
		},
		index: 0,
		cIndex: Math.floor(Math.random() * 3),
		list: idList,
		turns: [
			{
				id: idList[0],
				guesses: {
					correct: null,
					incorrect: []
				}
			}
		],
		players: [{
			username: user.username,
			userId: user.id,
			socketId: socket.id,
			rank: user.rank,
			elo: user.elo,
			score: 0,
			new: null
		}]
	}
}

function saveToSocket(socket, game) {
	//console.log('saving socket', game);
	socket.join(game.room);
	socket.request.session.game = game;
	socket.request.session.save();
}

function sendChallenge(io, sockets, roomId, username) {
	console.log('sending challenge');
	let notificationSocket = sockets.find(s => s.type == 'notification');
	let profileSocket = sockets.find(s => s.type == 'profile');
	if (notificationSocket) {
		let socketId = notificationSocket.socketId;
		io.to(socketId).emit('notify:challenge', {
			roomId: roomId,
			username: username
		});
	}
	if (profileSocket) {
		let socketId = profileSocket.socketId;
		io.to(socketId).emit('challenge:incoming', {
			roomId: roomId,
			username: username
		});
	}
}

async function joinGame(socket, game) {
	try {
		let user = socket.request.session.user;
		game.status = 'active';
		game.players.push({
			username: user.username,
			userId: user.id,
			socketId: socket.id,
			rank: user.rank,
			elo: user.elo,
			score: 0,
			new: null
		});
		//console.log(game)
		await game.save();
	} catch (err) {
		throw err;
	}
}

async function advance(io, game, bothWrong) {
	game.index++;
	await game.save();
	io.to(game.room).emit('advance', {
		index: game.index,
		bothWrong: bothWrong
	});
}

function emitGuessResponse(io, winner, loser, count) {
	io.to(winner.socketId).emit('win', {
		userScore: winner.score,
		opponentScore: loser.score,
		count: count
	});

	io.to(loser.socketId).emit('lose', {
		userScore: loser.score,
		opponentScore: winner.score,
		count: count
	});
}

async function updateElo(winnerId, loserId) {
	try {
		let proc = 'CALL sp_UpdateElo(?, ?)';
		let inputs = [winnerId, loserId];
		let data = await procHandler(gamesPool, proc, inputs);
		return data[0];
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

async function endGame(io, game, winner, loser, resigned) {
	game.status = 'closed';
	game.outcome.winner = winner.userId;
	
	if (resigned) {
		game.outcome.resigned = loser.userId;
	}

	let eloData = await updateElo(
		parseInt(winner.userId),
		parseInt(loser.userId)
	);

	winner.new.elo = eloData.winnerElo;
	winner.new.points = eloData.winnerPoints;
	loser.new.elo = eloData.loserElo;
	loser.new.points = eloData.loserPoints;
	await game.save();

	io.to(winner.socketId).emit('winner', {
		elo: winner.new,
		opponentElo: loser.new
	});

	io.to(loser.socketId).emit('loser', {
		elo: loser.new,
		opponentElo: winner.new
	});

	io.to(game.room).emit('gameover', {
		turns: game.turns,
		winner: winner.userId,
		ids: [winner.userId, loser.userId]
	});
}
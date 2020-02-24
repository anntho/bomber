const express = require('express');
const router = express.Router();
const https = require('https');

// Libraries
const preferences = require('../lib/preferences');
const access = require('../lib/access');
const data = require('../lib/data');
const games = require('../lib/games');
const users = require('../lib/users');
const metrics = require('../lib/metrics');

// Bin
const config = require('../bin/config');
const session = require('../bin/session');

// Create Server
const server = https.createServer(config.credentials);
server.listen(config.socket.port);

// Express Session
router.use(session);

// Socket.IO Config
const io = require('socket.io').listen(server);

// Socket.IO Middleware
io.use((socket, next) => {
	session(socket.request, socket.request.res, next);
});

io.on('connection', (socket) => {
	console.log(`connected on ${socket.id} : ${socket.handshake.address}`);
	if (socket.request.session.user) {
		console.log('user logged in as', socket.request.session.user.username);
	}

	// Echo
	socket.on('echo', async (data) => {
		console.log('echo...');
		socket.emit('echo', data);
	});

	// ===================================================
	// Data
	// ===================================================
	socket.on('movieList', async () => {
		await data.movieList(socket);
	});

	socket.on('actorList', async () => {
		await data.actorList(socket);
	});

	socket.on('starters', async () => {
		await data.starters(socket);
	});

	socket.on('getMovie', async (id) => {
		await data.getMovie(id, socket);
	});

	socket.on('getCast', async (id) => {
		await data.getCast(id, socket);
	});

	socket.on('getCredits', async (id) => {
		await data.getCredits(id, socket);
	});

	socket.on('getQuestions', async () => {
		await data.getQuestions(socket);
	});

	socket.on('getMovieDocs', async (id) => {
		await data.getMovieDocs(socket, id);
	});

	socket.on('getAllMovies', async () => {
		await data.getAllMovies(socket);
	});

	// ===================================================
	// Site Metrics
	// ===================================================
	socket.on('getUsers', async () => {
		await metrics.getUsers(socket);
	});

	// ===================================================
	// Access
	// ===================================================
	socket.on('login', async (data) => {
		await access.login(data, socket);
	});

	socket.on('register', async (data) => {
		await access.register(data, socket);
	});

	socket.on('reset:step1', async (data) => {
		await access.resetStep1(data, socket);
	});

	socket.on('reset:step2', async (data) => {
		await access.resetStep2(data, socket);
	});

	socket.on('updateSocket', async(data) => {
		await access.updateSocket(data, socket);
	});

	// ===================================================
	// Prefereces
	// ===================================================
	socket.on('editEmail', async (data) => {
		await preferences.editEmail(data, socket);
	});

	socket.on('editPassword', async (data) => {
		await preferences.editPassword(data, socket);
	});

	socket.on('deleteAccount', async (data) => {
		await preferences.deleteAccount(data, socket);
	});

	// ===================================================
	// Users
	// ===================================================
	socket.on('follow', async (data) => {
		await users.follow(data, socket);
	});

	socket.on('unfollow', async (data) => {
		await users.unfollow(data, socket);
	});

	socket.on('message', async (data) => {
		await users.message(data, socket, io);
	});

	socket.on('block', async (data) => {
		await users.block(data, socket);
	});

	socket.on('unblock', async (data) => {
		await users.unblock(data, socket);
	});

	socket.on('getMessages', async (data) => {
		await users.getMessages(data, socket);
	});

	socket.on('deleteConversation', async (data) => {
		await users.deleteConversation(data, socket);
	});

	socket.on('findOpenChallenge', async (data) => {
		await users.findOpenChallenge(socket);
	});

	// ===================================================
	// Games
	// ===================================================
	socket.on('game', async (data) => {
		await games.saveGame(data, socket);
	});

	socket.on('cancel', async () => {
		await games.cancel(io, socket);
	});

	socket.on('close', async () => {
		await games.close(socket);
	});

	socket.on('resign', async (data) => {
		await games.resign(io, socket, data);
	});

	socket.on('search', async (data) => {
		await games.search(io, socket, data);
	});

	socket.on('joinById', async(data) => {
		await games.joinById(io, socket, data);
	});

	socket.on('update', async () => {
		await games.update(socket);
	});

	socket.on('addList', async (data) => {
		await games.addList(data, socket);
	});

	socket.on('guess', async (data) => {
		await games.guess(io, socket, data);
	});

	socket.on('lobby', async (data) => {
		await games.lobby(data, socket);
	});

	socket.on('challenge', async (data) => {
		await games.challenge(io, socket, data);
	});

	socket.on('accept', async (data) => {
		await games.accept(io, socket, data);
	});

	socket.on('decline', async (data) => {
		await games.decline(io, socket, data);
	});
});

module.exports = router;
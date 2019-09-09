const express = require('express');
const router = express.Router();
const https = require('https');
const mysql = require('mysql');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const randomString = require('crypto-random-string');

// Libraries
const { sendEmail } = require('../lib/email');
const preferences = require('../lib/preferences');

// Bin
const config = require('../bin/config');
const session = require('../bin/session');
const line = '---------------------------------';

// TMDb API
const TMDB_KEY = `?api_key=${config.tmdb.key}`;
const URL_BASE = 'https://api.themoviedb.org/3';

// Database Config
const socketPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');

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

	socket.on('movieList', async () => {
		try {
			let results = await procHandler(socketPool, 'CALL sp_GetAllMovies()', null);
			socket.emit('movieList', results);
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	});

	socket.on('actorList', async () => {
		try {
			let results = await procHandler(socketPool, 'CALL sp_GetAllActors()', null);
			socket.emit('actorList', results);
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	});

	socket.on('starters', async () => {
		try {
			let movies = await procHandler(socketPool, 'CALL sp_GetAllMovies()', null);
			let actors = await procHandler(socketPool, 'CALL sp_GetAllActors()', null);
			socket.emit('starters', {
				movies: movies,
				actors: actors
			});
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	});

	socket.on('getMovie', async (id) => {
		if (!id) {
			socket.emit('err');
		} else {
			try {
				let uri = URL_BASE + '/movie/' + id + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getMovie', data);
			} catch (err) {
				socket.emit('err');
			}
		}
	});

	socket.on('getCast', async (id) => {
		if (!id) {
			socket.emit('err');
		} else {
			try {
				let uri = URL_BASE + '/movie/' + id + '/credits' + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getCast', data);
			} catch (err) {
				socket.emit('err');
			}
		}
	});

	socket.on('getCredits', async (id) => {
		if (!id) {
			socket.emit('err');
		} else {
			try {
				let uri = URL_BASE + '/person/' + id + '/movie_credits' + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getCredits', data);
			} catch (err) {
				socket.emit('err');
			}
		}
	});

	socket.on('getQuestions', async (id) => {
		try {
			let questions = await procHandler(socketPool, 'CALL sp_GetQuestions()', null);
			socket.emit('getQuestions', questions);
		} catch (err) {
			console.log(err);
		}
	});

	// Check Live
	socket.on('live', async () => {
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
	});

	socket.on('getUsers', async () => {
		try {
			let results = await procHandler(socketPool, 'CALL sp_GetAllUsers()', null);
			socket.emit('getUsers', results);
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	});

	// echo
	socket.on('echo', async (data) => {
		console.log('echo...')
		socket.emit('echo', data);
	});

	// save game
	socket.on('game', async (data) => {
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
				await procHandler(socketPool, updateProc, updateInputs);

				if (data.package) {
					let insertProc = 'CALL sp_InsertPackage(?, ?)';
					let uglyPackage = JSON.stringify(data.package);
					let insertInputs = [data.sid, uglyPackage];
					await procHandler(socketPool, insertProc, insertInputs);
					socket.emit('complete');
				}
			} else {
				socket.emit('err');
			}
		} catch (err) {
			console.log(err);
			socket.emit('err');
		}
	});


	// Prefereces
	socket.on('editUsername', async (data) => {
		await preferences.editUsername(data, socket);
	});

	socket.on('editEmail', async (data) => {
		await preferences.editEmail(data, socket);
	});

	socket.on('editPassword', async (data) => {
		await preferences.editPassword(data, socket);
	});

	socket.on('checkPassword', async (data) => {
		await preferences.checkPassword(data, socket);
	});

	// Create or Join Game
	socket.on('find', async (data) => {
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
						console.log('---------------------------------');

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
					socket.emit('error', err);
				}
			}
		}
	});



	// Login
	socket.on('login', async (data) => {
		console.log('Login Requested');
		console.log(data.username);
		console.log(line);

		try {
			const sql = `CALL sp_GetUser(?)`;
			const inputs = [data.username];
			const user = await procHandler(socketPool, sql, inputs);
			
			if (!user.length) {
                socket.emit('err', 'User not found');
            } else {
                // Match Password
                bcrypt.compare(data.password, user[0].password, (err, match) => {
                    if (err) {
                    	console.log(err);
                    } else {
                    	if (match) {
	                    	socket.request.session.user = user[0];
	                    	socket.request.session.save();
	                    	console.log(socket.request.session);
	                        socket.emit('success');
	                    } else {
	                        socket.emit('err', 'Incorrect password');
	                    }
                    }
                });
            }
		} catch (err) {
			console.log(err);
		}
	});

	// Register
	socket.on('register', async (data) => {
		console.log('Registering User');
		console.log('RAW data:');
		console.log(data);
		console.log(line);

		let error = '';
		let uname = data.uname;
		let email = data.email;
		let password = data.password;
		let password2 = data.password2;

		if (!uname || !email || !password || !password2) {
			error = 'Missing required fields';
			return socket.emit('err', error);
		} else if (password !== password2) {
			error = 'Passwords do not match';
			return socket.emit('err', error);
		} else {
			try {
				// Check if Username Exists
				const getUserSQL = `CALL sp_GetUser(?)`;
				const getUserInputs = [uname];
				const foundUser = await procHandler(socketPool, getUserSQL, getUserInputs);
				
				if (foundUser && foundUser.length) {
					error = 'That username is unavailable, please try a different one';
					return socket.emit('err', error);
				} else {
					// Check if Email Exists
					const getEmailSQL = `CALL sp_GetUserByEmail(?)`;
					const getEmailInputs = [email];
					const foundEmail = await procHandler(socketPool, getEmailSQL, getEmailInputs);

					if (foundEmail && foundEmail.length) {
						error = 'An account is already registered with that email address';
						return socket.emit('err', error);
					} else {
						bcrypt.genSalt(10, (err, salt) => 
							bcrypt.hash(password, salt, async (err, hash) => {
								if (err) {
									console.log(err);
									error = 'An error occured';
									return socket.emit('err', error);
								}

								try {
									const code = randomString({length: 32, type: 'url-safe'});
									const encodedVerificationString = Buffer.from(`${email}:${code}`).toString('base64');

									const newUserSQL = 'CALL sp_InsertUser(?, ?, ?, ?)';
									const newUserInputs = [uname, email, hash, code]; // save raw code, but email base64 encoded
									const newUser = await procHandler(socketPool, newUserSQL, newUserInputs);

									if (newUser && 
										newUser[0] &&
										newUser[0].verified === 0) {
											console.log('verified first time user', email)
											let link = config.socket.host + '/verify?v=' + encodedVerificationString;
											let body = 'Please click the link below to verify your email address:';
											body += `<a href="${link}">Click here to verify</a>`;
											try {
												await sendEmail(email, 'Please verify your email address', body);
												socket.emit('success');
											} catch (err) {
												socket.emit('err', err);
											}
									} else {
										socket.emit('err', null);
									}
								} catch (err) {
									console.log(err);
									socket.emit('err', err);
								}
						}));
					}
				}
			} catch (err) {
				console.log(err);
			}
		}
	});
});



module.exports = router;
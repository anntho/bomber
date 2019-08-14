const express = require('express');
const router = express.Router();
const https = require('https');
const mysql = require('mysql');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const randomString = require('crypto-random-string');
const { sendEmail } = require('../lib/email');

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
			let sid = data.sid || randomString({length: 32});
			let proc = 'CALL sp_InsertGame(?, ?, ?, ?, ?, ?)';
			let inputs = [sid, userId, data.score, data.event, data.mode, data.participants];
			let results = await procHandler(socketPool, proc, inputs);
			let newRowId = results[0].newRowId;

			if (data.event === 'start') {
				socket.emit('game', sid);
			}

			if (results && 
				results[0] && 
				data.event === 'end') {
				try {
					let proc = 'CALL sp_InsertPackage(?, ?, ?)';
					let uglyPackage = JSON.stringify(data.package);
					let inputs = [newRowId, sid, uglyPackage];
					await procHandler(socketPool, proc, inputs);
					socket.emit('complete');
				} catch (err) {
					console.log(err);
					socket.emit(err);
				}
			}
		} catch (err) {
			console.log(err);
		}
	});


	// Preferences
	socket.on('updateUser', async (data) => {
		if (!data) {
			return socket.emit('err', 'Empty Request');
		}
		if (!socket.request.session) {
			return socket.emit('err');
		}
		if (data.id !== socket.request.session.user.id) {
			return socket.emit('err');
		}

		let user = socket.request.session.user;
		let updateSession = false;

		if (data.type === 'username') {
			let error = '';
			if (user.changedUsername == 1) {
				error = 'You are only allowed to edit your username once.';
				return socket.emit('err', error);
			}
			let username = data.username.trim();
			let usernameRegex = /[^0-9a-z_]/gi;
			let failures = username.match(usernameRegex);
			if (failures) {
				error = 'Username must contain only alphanumeric characters';
				socket.emit('err', error);
			} else {
				if (username.length > 15) {
					error = 'Username must be 15 characters or less';
					socket.emit('err', error);
				} else {
					let updateUsernameProc = 'CALL sp_UpdateUsername(?, ?)';
					let updateUsernameInputs = [username, user.id];
					try {
						let response = await procHandler(socketPool, updateUsernameProc, updateUsernameInputs);
						updateSession = true;
						socket.emit('success', {
							username: username
						});
					} catch (err) {
						console.log(err);
						console.log(line);
						error = 'An error occured';
						socket.emit('err', error);
					}
				}
			}
		}

		if (data.type === 'email') {
			let error = '';
			let email = data.email.trim();
			let updateEmailProc = 'CALL sp_UpdateEmail(?, ?)';
			let updateEmailInputs = [email, user.id];
			try {
				let response = await procHandler(socketPool, updateEmailProc, updateEmailInputs);
				updateSession = true;
				socket.emit('success', {
					email: email
				});
			} catch (err) {
				console.log(err);
				console.log(line);
				socket.emit('err');
			}
		}

		if (data.type === 'password') {
			let error = '';
			let currentPassword = data.passwords[0];
			let newPassword = data.passwords[1];
			let confirmNewPassword = data.passwords[2];

			if (newPassword !== confirmNewPassword) {
				socket.emit('err', 'Passwords do not match');
			} else if (currentPassword === newPassword) {
				socket.emit('err', 'Please choose a new password');
			} else {
				bcrypt.compare(currentPassword, user.password, (err, match) => {
	                if (err) {
	                	console.log(err);
	                	socket.emit('err');
	                } else {
	                	if (!match) {
	                		socket.emit('err', 'Incorrect password');
	               		} else {
	                		console.log('match')
	                		// hash new password
	                		bcrypt.genSalt(10, (err, salt) => 
								bcrypt.hash(newPassword, salt, async (err, hash) => {
									if (err) {
										console.log(err);
										return socket.emit('err');
									}

									console.log(hash);

									let updatePasswordProc = 'CALL sp_UpdatePassword(?, ?)';
									let updatePasswordInputs = [hash, user.id];

									try {
										let response = await procHandler(socketPool, updatePasswordProc, updatePasswordInputs);
										updateSession = true;
										socket.emit('success', {
											redirect: true,
											location: '/logout'
										});
									} catch (err) {
										console.log(err);
										console.log(line);
										socket.emit('err');
									}
							}));
	                    }
	                }
	            });
			}
		}

		if (data.type === 'close') {
			console.log('close')
		}

		if (updateSession) {
			// Update Session
			let updateSessionProc = 'CALL sp_FindUserById(?)';
			let updateSessionInputs = [user.id];
			let reUser = await procHandler(socketPool, updateSessionProc, updateSessionInputs);
			console.log('user lookup');
			console.log(reUser[0]);
			if (reUser && reUser[0]) {
				console.log('saving session');
				socket.request.session.user.username = reUser[0].username;
				socket.request.session.user.changedUsername = reUser[0].changedUsername;
				socket.request.session.save();
				console.log('updated session');
				console.log(socket.request.session.user);
			}
		}
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
			const sql = `CALL sp_findUser(?)`;
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
				const findUserSQL = `CALL sp_findUser(?)`;
				const findUserInputs = [uname];
				const foundUser = await procHandler(socketPool, findUserSQL, findUserInputs);
				
				if (foundUser && foundUser.length) {
					error = 'That username is unavailable, please try a different one';
					return socket.emit('err', error);
				} else {
					// Check if Email Exists
					const findEmailSQL = `CALL sp_findUserByEmail(?)`;
					const findEmailInputs = [email];
					const foundEmail = await procHandler(socketPool, findEmailSQL, findEmailInputs);

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

									const newUserSQL = 'CALL sp_CreateUser(?, ?, ?, ?)';
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
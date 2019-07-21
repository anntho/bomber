const express = require('express');
const router = express.Router();
const https = require('https');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const randomString = require('crypto-random-string');
const { sendEmail } = require('../lib/email');

const config = require('../bin/config');
const session = require('../bin/session');
const line = '---------------------------------';

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
	console.log('connected on', socket.id);
	if (socket.request.session.user) {
		console.log('user logged in as', socket.request.session.user.username);
	}

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





	// Save Score
	socket.on('score', async (data) => {
		console.log('received')
		console.log(data)
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
			console.log(user)
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
					error = 'Username already exists';
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

								console.log(hash)

								try {
									const code = cryptoRandomString({length: 32, type: 'url-safe'});
									const verification = Buffer.from(`${email}:${code}`).toString('base64');

									const newUserSQL = 'CALL sp_CreateUser(?, ?, ?, ?)';
									const newUserInputs = [uname, email, hash, verification];
									const newUser = await procHandler(socketPool, newUserSQL, newUserInputs);
									socket.emit('success');
								} catch (err) {
									console.log(err);
									throw err;
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
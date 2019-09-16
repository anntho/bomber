const mysql = require('mysql');
const config = require('../bin/config');
const bcrypt = require('bcryptjs');
const randomString = require('crypto-random-string');
const accessPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/access.js';

module.exports = {
    register: async (data, socket) => {
        console.log('new user');
		console.log(data);
		console.log(line);

		let errorMessage = '';
		let uname = data.uname;
		let email = data.email;
		let password = data.password;
		let password2 = data.password2;

		if (!uname || !email || !password || !password2) {
			errorMessage = 'Missing required fields.';
			return socket.emit('err', {
                error: errorMessage
            });
		} else if (password !== password2) {
			errorMessage = 'Passwords do not match.';
			return socket.emit('err', {
                error: errorMessage
            });
		} else {
			try {
				const getUserSQL = `CALL sp_GetUser(?)`;
				const getUserInputs = [uname];
				const foundUser = await procHandler(accessPool, getUserSQL, getUserInputs);
				
				if (foundUser && foundUser.length) {
					errorMessage = 'That username is unavailable, please try a different one.';
					return socket.emit('err', {
                        error: errorMessage
                    });
				} else {
					const getEmailSQL = `CALL sp_GetUserByEmail(?)`;
					const getEmailInputs = [email];
					const foundEmail = await procHandler(accessPool, getEmailSQL, getEmailInputs);

					if (foundEmail && foundEmail.length) {
						errorMessage = 'An account is already registered with that email address.';
						return socket.emit('err', {
                            error: errorMessage
                        });
					} else {
						bcrypt.genSalt(10, (err, salt) => 
							bcrypt.hash(password, salt, async (err, hash) => {
								if (err) {
                                    reportError(file, '60', err, true);
									errorMessage = 'An error occured processing your request.';
									return socket.emit('err', {error: errorMessage});
								}

								try {
									const code = randomString({length: 32, type: 'url-safe'});
									const encodedVerificationString = Buffer.from(`${email}:${code}`).toString('base64');

									const newUserSQL = 'CALL sp_InsertUser(?, ?, ?, ?)';
									const newUserInputs = [uname, email, hash, code]; // save raw code, but email base64 encoded
									const newUser = await procHandler(accessPool, newUserSQL, newUserInputs);

									if (newUser && newUser[0]) {
                                        console.log('verified first time user', email);
                                        let link = config.socket.host + '/verify?v=' + encodedVerificationString;
                                        let body = 'Please click the link below to verify your email address:';
                                        body += '<br>';
                                        body += `<a href="${link}">Click here to verify</a>`;
                                        try {
                                            await sendEmail(email, 'Please verify your email address', body);
                                            socket.emit('success');
                                        } catch (err) {
                                            reportError(file, '82', err, true);
                                            socket.emit('err', {error: err});
                                        }
									} else {
                                        console.log('failed')
                                    }
								} catch (err) {
									reportError(file, '87', err, true);
									socket.emit('err', {error: err});
								}
						}));
					}
				}
			} catch (err) {
				reportError(process.env, file, '94', err, true);
			}
		}
    },
    login: async (data, socket) => {
		console.log('login requested >>', data.username);

		try {
			const sql = `CALL sp_GetUser(?)`;
			const inputs = [data.username];
			const user = await procHandler(accessPool, sql, inputs);

			if (!user.length) {
                socket.emit('err', {error: 'User not found'});
            } else {
                bcrypt.compare(data.password, user[0].password, (err, match) => {
                    if (err) {
                        reportError(file, '114', err, true);
                        socket.emit('err', {error: err});
                    } else {
                    	if (match) {
	                    	socket.request.session.user = user[0];
	                    	socket.request.session.save();
	                    	//console.log(socket.request.session);
	                        socket.emit('success');
	                    } else {
	                        socket.emit('err', {error: 'Incorrect password'});
	                    }
                    }
                });
            }
		} catch (err) {
            reportError(file, '129', err, true);
            socket.emit('err', {error: err});
		}
    }
}
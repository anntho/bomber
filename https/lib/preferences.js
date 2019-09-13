const mysql = require('mysql');
const config = require('../bin/config');
const bcrypt = require('bcryptjs');
const preferencesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const us = require('./updateSession');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/preferences.js';

module.exports = {
    checkPassword: async (data, socket) => {
		if (!data || !data.password || !socket.request.session || data.id !== socket.request.session.user.id) {
            console.log('err on backend')
			return socket.emit('err');
        }
        let user = socket.request.session.user;
        bcrypt.compare(data.password, user.password, (err, match) => {
            if (err) {
                console.log(err);
                socket.emit('err');
            } else {
                if (match) {
                    socket.emit('checkPassword', true);
                } else {
                    socket.emit('checkPassword', false);
                }
            }
        });
    },
    editPassword: async (data, socket) => {
        console.log(data);
		if (!data || !data.id || !socket.request.session || data.id !== socket.request.session.user.id) {
			return socket.emit('err');
		}

        let error = '';
        let currentPassword = data.passwords[0];
        let newPassword = data.passwords[1];
        let confirmNewPassword = data.passwords[2];
    
        if (newPassword !== confirmNewPassword) {
            return socket.emit('err', 'Passwords do not match');
        } else if (currentPassword === newPassword) {
            return socket.emit('err', 'Please choose a new password');
        } else {
            bcrypt.genSalt(10, (err, salt) =>
                bcrypt.hash(newPassword, salt, async (err, hash) => {
                    if (err) {
                        console.log(err);
                        return socket.emit('err');
                    }
                    console.log(hash);
                    let updatePasswordProc = 'CALL sp_UpdatePasswordd(?, ?)';
                    let updatePasswordInputs = [hash, user.id];
                    try {
                        console.log('going to update password')
                        let response = await procHandler(socketPool, updatePasswordProc, updatePasswordInputs);
                        // updateSession = true;
                        // socket.emit('success', {
                        //     redirect: true,
                        //     location: '/logout'
                        // });
                    } catch (err) {
                        socket.emit('err');
                        reportError(file, '67', err, true);
                    }
            }));
        }
    },
    editUsername: async (data, socket) => {
        console.log(data);
		if (!data || !data.id || !socket.request.session || data.id !== socket.request.session.user.id) {
			return socket.emit('err');
		}

		let user = socket.request.session.user;
		let updateSession = false;
        let error = '';
        let code = 1;

		if (user.changedUsername == 1) {
			error = 'You are only allowed to edit your username once.';
			socket.emit('err', {
                code: code,
                error: error
            });
		} else {
			let username = data.username.trim();
			let regex = /[^0-9a-z_]/gi;
			if (username.match(regex)) {
				error = 'Username must contain only alphanumeric characters.';
				socket.emit('err', {
                    code: code,
                    error: error
                });
			} else {
				if (username.length > 15) {
					error = 'Username must be 15 characters or less.';
					socket.emit('err', {
                        code: code,
                        error: error
                    });
				} else {
					let updateUsernameProc = 'CALL sp_UpdateUsername(?, ?)';
					let updateUsernameInputs = [username, user.id];
					try {
                        await procHandler(preferencesPool, updateUsernameProc, updateUsernameInputs);
                        console.log('need to update session')
						updateSession = true;
						socket.emit('editUsername', {
							username: username
						});
					} catch (err) {
						reportError(file, '117', err, true);
						error = 'We encountered an issue processing your request.';
						socket.emit('err', {
                            code: code,
                            error: error
                        });
					}
				}
			}
		}

		if (updateSession) {
			await us.updateSession(user.id, socket);
		}
    },
    editEmail: async (data, socket) => {
		if (!data || !data.id || !socket.request.session || data.id !== socket.request.session.user.id) {
			return socket.emit('err');
		}

		let user = socket.request.session.user;
		let updateSession = false;
        let error = '';
        let code = 2;

		let email = data.email.trim();
		let updateEmailProc = 'CALL sp_UpdateEmail(?, ?)';
		let updateEmailInputs = [email, user.id];

		try {
            await procHandler(preferencesPool, updateEmailProc, updateEmailInputs);
            let content = '';
            content += '<p>You recently updated your email address</p>';
            content += '<p>' + 'IP Address: ' + socket.handshake.address.split('f:')[1];
            content += '<p>' + 'User: ' + user.username;
            content += '<p>' + 'Email: ' + user.email;
            await sendEmail(
                email,
                'moviebomber.org | Email Address Updated',
                content
            );
			updateSession = true;
			socket.emit('editEmail', {
				email: email
			});
		} catch (err) {
			reportError(file, '163', err, true);
            error = 'We encountered an issue processing your request.';
			socket.emit('err', {
                code: code,
                error: error
            });
		}

		if (updateSession) {
			await us.updateSession(user.id, socket);
		}
    }
}
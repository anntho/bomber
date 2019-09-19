const mysql = require('mysql');
const config = require('../bin/config');
const bcrypt = require('bcryptjs');
const geoip = require('geoip-lite');
const randomString = require('crypto-random-string');
const swearjar = require('swearjar');
const accessPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/access.js';
const generic = 'We encountered an issue processing your request. Please contact our support team.';

async function emailAlertHTML(ip, username, verification) {
    const now = new Date();
    const dateString = now.toString();
    const geo = geoip.lookup(ip);
	const location = `${geo.city}, ${geo.region}`;
	const link = config.socket.host + '/verify?v=' + verification;

    let content = `<p><h5>moviebomber.org | Automated Account Alerts</h5></p>`;
    content += `<p><h4>Hey there ${username},</h4></p>`;
	content += '<p>Please click the link below to verify your email address:</p>';
	content += `<p><a href="${link}">Click here to verify</a></p>`;

	content += `<ul style="font-size: 10px;"><li>Date/Time: ${dateString}</li>`;
	content += `<li>IP Address (Location): ${ip} (${location})</li>`;
	content += `</ul>`;

    return content;
}

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
						try {
							const salt = await bcrypt.genSaltSync(10);
							const hash = await bcrypt.hashSync(password, salt);
							const code = randomString({length: 32, type: 'url-safe'});
							const encodedVerificationString = Buffer.from(`${email}:${code}`).toString('base64');
							const newUserSQL = 'CALL sp_InsertUser(?, ?, ?, ?)';
							const newUserInputs = [uname, email, hash, code]; // save raw code, but email base64 encoded
							const newUser = await procHandler(accessPool, newUserSQL, newUserInputs);

							if (newUser && newUser[0]) {
								console.log('verified first time user', email);
								let ipAddress = socket.handshake.address.split(':')[3];
								let html = await emailAlertHTML(ipAddress, uname, encodedVerificationString);
								await sendEmail(email, 'Please verify your email address', html);
								socket.emit('success');
							}
						} catch (err) {
							reportError(file, '97', err, true);
							return socket.emit('err', {error: generic});
						}
					}
				}
			} catch (err) {
				reportError(file, '102', err, true);
				return socket.emit('err', {error: generic});
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
                        reportError(file, '119', err, true);
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
            reportError(file, '134', err, true);
            socket.emit('err', {error: err});
		}
    }
}
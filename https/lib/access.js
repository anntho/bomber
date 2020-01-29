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

function emailResetCode(ip, code) {
    const now = new Date();
    const dateString = now.toString();
    const geo = geoip.lookup(ip);
	const location = `${geo.city}, ${geo.region}`;
	const link = `${config.socket.host}/password/reset/verified/${code}`;

	let content = `<p><h5>moviebomber.org | Password Reset Link</h5></p>`;
	content += `<p>Please click <a href="${link}">here</a> to reset your password.</p>`;
	content += `<ul style="font-size: 10px;"><li>Date/Time: ${dateString}</li>`;
	content += `<li>IP Address (Location): ${ip} (${location})</li>`;
	content += `</ul>`;

    return content;
}

module.exports = {
    register: async (data, socket) => {
        console.log('new user request:');
		console.log(data);
		console.log(line);

		let errorMessage = '';
		let uname = data.uname.trim();
		console.log(`trimmed ${uname}`);
		let email = data.email;
		let password = data.password;
		let password2 = data.password2;

		if (!uname || !email || !password || !password2) {
			errorMessage = 'Missing required fields';
			return socket.emit('err', {error: errorMessage});
		} else if (password !== password2) {
			errorMessage = 'Passwords do not match';
			return socket.emit('err', {error: errorMessage});
		} else if (swearjar.profane(uname)) {
			errorMessage = 'Username is unavailable';
			return socket.emit('err', {error: errorMessage});
		} else {
			try {
				const getUserSQL = `CALL sp_CheckUsername(?)`;
				const getUserInputs = [uname];
				const foundUser = await procHandler(accessPool, getUserSQL, getUserInputs);
				
				if (foundUser && foundUser.length) {
					errorMessage = 'That username is unavailable, please try a different one';
					return socket.emit('err', {error: errorMessage});
				} else {
					const getEmailSQL = `CALL sp_GetUserByEmail(?)`;
					const getEmailInputs = [email];
					const foundEmail = await procHandler(accessPool, getEmailSQL, getEmailInputs);

					if (foundEmail && foundEmail.length) {
						errorMessage = 'An account is already registered with that email address';
						return socket.emit('err', {error: errorMessage});
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
								console.log(`verified first time user [${email} | ${uname}]`);
								let ipAddress = socket.handshake.address.split(':')[3];
								let html = await emailAlertHTML(ipAddress, uname, encodedVerificationString);
								await sendEmail(email, 'Please verify your email address', html);
								socket.emit('success');
							}
						} catch (err) {
							reportError(file, '91', err, true);
							return socket.emit('err', {error: generic});
						}
					}
				}
			} catch (err) {
				reportError(file, '97', err, true);
				return socket.emit('err', {error: generic});
			}
		}
    },
    login: async (data, socket) => {
		console.log(`login requested [${data.username}]`);

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
	                        socket.emit('success', {
								username: user[0].username
							});
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
	},
	resetStep1: async (data, socket) => {
		console.log('password reset | step 1');
		console.log(data);
		try {
			let code = randomString({length: 16});
			let proc = 'CALL sp_InsertResetCode(?, ?)';
			let inputs = [
				code,
				data.email
			];
			console.log(inputs);
			let result = await procHandler(accessPool, proc, inputs);
			console.log(result);
			if (result[0].success == 1) {
				socket.emit('success:step1');
				let ipAddress = socket.handshake.address.split(':')[3];
				let html = await emailResetCode(ipAddress, code);
				await sendEmail(data.email, 'Password reset link', html);
			} else {
				socket.emit('failure');
			}
		} catch (err) {
			reportError(file, '147', err, true);
			return socket.emit('err', {error: generic});
		}
	},
	resetStep2: async (data, socket) => {
		console.log('password reset | step 2');
		console.log(data);
		try {
			if (data.pass1 == data.pass2) {
				// 1. Get user by code
				let codeLookupQuery = 'CALL sp_LookupCode(?)';
				let CodeLookupInputs = [data.code];

				let result = await procHandler(accessPool, codeLookupQuery, CodeLookupInputs);
				if (result && result[0] && result[0].used == 0) {
					let salt = await bcrypt.genSaltSync(10);
					let hash = await bcrypt.hashSync(data.pass1, salt);
					
					let resetQuery = 'CALL sp_UpdatePassword(?, ?)';
					let resetInputs = [hash, result[0].userId];

					let expireQuery = 'CALL sp_ExpireResetCode(?)';
					let expireInputs = [result[0].code];

					await procHandler(accessPool, resetQuery, resetInputs);
					await procHandler(accessPool, expireQuery, expireInputs);
					socket.emit('success:step2');
				} else {
					socket.emit('failure');
				}
			}
		} catch (err) {
			reportError(file, '201', err, true);
			return socket.emit('err', {error: generic});
		}
	},
	updateSocket: async (type, socket) => {
        if (socket.request.session.user) {
			try {
				const userId = socket.request.session.user.id;
				const proc = 'CALL sp_InsertSocket(?, ?, ?)';
				const inputs = [userId, String(socket.id), type];
				await procHandler(accessPool, proc, inputs);
			} catch (err) {
				reportError(file, '219', err, false);
				return socket.emit('err', {error: generic});
			}
		}
	}
}
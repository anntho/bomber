const mysql = require('mysql');
const config = require('../bin/config');
const bcrypt = require('bcryptjs');
const geoip = require('geoip-lite');
const preferencesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const us = require('./updateSession');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/preferences.js';
const generic = 'We encountered an issue processing your request. Please contact our support team.';

async function emailAlertHTML(ip, username, code, description) {
    const now = new Date();
    const dateString = now.toString();
    const geo = geoip.lookup(ip);
    const location = `${geo.city}, ${geo.region}`;
    const resetLink = '/reset';
    const image = 'https://dev.moviebomber.org/images/logo.png';

    let content = `<p><h5>moviebomber.org | Automated Account Alerts</h5></p>`;
    content += `<p><h4>Hey there ${username},</h4></p>`;
    content += `<p>You are receiving this email due to a recent change on your account.</p>`;
    content += `<p>Change Description: ${description}</p>`;
    content += `<p>Date/Time: ${dateString}</p>`;
    content += `<p>IP Address (Location): ${ip} (${location})</p>`;
    content += `<p>If you beleive that this is a mistake, you can reply directly to this email.</p>`;
    
    if (code === 3) {
        content += `<p><a href="${resetLink}">Reset your password</a></p>`;
    }

    if (code === 4) {
        content += `<p><h2>We're sorry to see you go!</h2></p>`;
    }

    content += `<div style="margin-top: 25px;">`;
    content += `<img style="width: 300px; height: 100px" src="${image}">`
    content += `</div>`;

    return content;
}

module.exports = {
    editEmail: async (data, socket) => {
		if (!data.email || !socket.request.session || !socket.request.session.user) {
			return socket.emit('err', {error: generic});
        }
        
        console.log(data);

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
			reportError(file, '132', err, true);
			socket.emit('err', {
                code: code,
                error: generic
            });
		}

		if (updateSession) {
			await us.updateSession(user.id, socket);
		}
    },
    editPassword: async (data, socket) => {
		if (!data || !socket.request.session || !socket.request.session.user) {
			return socket.emit('err', {error: generic});
        }
        
        console.log(data);
        let user = socket.request.session.user;
		let updateSession = false;
        let error = '';
        let code = 3;

        let currentPassword = data.current;
        let newPassword = data.new;
        let confirmNewPassword = data.confirm;

        try {
            let checkCurrentPassword = await bcrypt.compare(currentPassword, user.password);
            console.log('checking current password >> ', checkCurrentPassword);

            if (!checkCurrentPassword) {
                error = 'Current password is incorrect';
                return socket.emit('err', {code: code, error: error});
            } else if (newPassword !== confirmNewPassword) {
                error = 'Passwords do not match';
                return socket.emit('err', {code: code, error: error});
            } else if (currentPassword === newPassword) {
                error = 'Your new password cannot be the same as your old password';
                return socket.emit('err', {code: code, error: error});
            } else {
                try {
                    const salt = await bcrypt.genSaltSync(10);
                    const hash = await bcrypt.hashSync(newPassword, salt);
                    const proc = 'CALL sp_UpdatePassword(?, ?)';
                    const inputs = [hash, user.id];

                    await procHandler(preferencesPool, proc, inputs);

                    updateSession = true;
                    socket.emit('editPassword');

                    // send alert email
                    let desciption = 'Password Reset';
                    let ipAddress = socket.handshake.address.split(':')[3];
                    let html = await emailAlertHTML(ipAddress, user.username, code, desciption);
                    await sendEmail(user.email, desciption, html);
                } catch (err) {
                    reportError(file, '189', err, true);
                    return socket.emit('err', {code: code, error: generic});
                }
            }

            if (updateSession) {
                await us.updateSession(user.id, socket);
            }
        } catch (err) {
            reportError(file, '198', err, true);
            return socket.emit('err', {code: code, error: generic});
        }
    },
    deleteAccount: async (data, socket) => {
		if (!socket.request.session || !socket.request.session.user) {
			return socket.emit('err', {error: generic});
        }
        
        console.log(data);
        let user = socket.request.session.user;
		let updateSession = false;
        let code = 4;

        try {
            const proc = 'CALL sp_DeleteAccount(?)';
            const inputs = [user.id];
            await procHandler(preferencesPool, proc, inputs);

            socket.emit('deleteAccount');

            // send alert email
            let desciption = 'Account Deactivated';
            let ipAddress = socket.handshake.address.split(':')[3];
            let html = await emailAlertHTML(ipAddress, user.username, code, desciption);
            await sendEmail(user.email, 'Sorry to see you go!', html);

            if (updateSession) {
                await us.updateSession(user.id, socket);
            }
        } catch (err) {
            reportError(file, '229', err, true);
            socket.emit('err', {code: code, error: generic});
        }
    }
}
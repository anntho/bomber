const mysql = require('mysql');
const config = require('../bin/config');
const usersLibPool = mysql.createPool(config.mysql);
const { procHandler, procHandler2 } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const randomString = require('crypto-random-string');

const line = '---------------------------------';
const file = 'lib/users.js';

module.exports = {
    follow: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                let userId = socket.request.session.user.id;
                let userToFollowId = data.userId;
    
                let proc = 'CALL sp_Follow(?, ?)';
                let inputs = [userToFollowId, userId];
    
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('follow');
            } catch (err) {
                reportError(file, '23', err, false);
            }
        }
    },
    unfollow: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                let userId = socket.request.session.user.id;
                let userToUnfollow = data.userId;
    
                let proc = 'CALL sp_Unfollow(?, ?)';
                let inputs = [userToUnfollow, userId];
    
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('unfollow');
            } catch (err) {
                reportError(file, '39', err, false);
            }
        }
    },
    message: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                const userId = socket.request.session.user.id;
                const message = data.message.trim().replace(/[|&;$%@"<>()+,]/g, '');
                const proc = 'CALL sp_InsertMessage(?, ?, ?)';
                const inputs = [userId, data.recipientId, message];

                await procHandler(usersLibPool, proc, inputs);
                socket.emit('message');
            } catch (err) {
                reportError(file, '63', err, false);
            }
        }
    },
    getMessages: async (userId) => {
        try {
            const proc = 'CALL sp_GetMessages(?)';
            const inputs = [userId];
            return await procHandler2(usersLibPool, proc, inputs);
        } catch (err) {
            reportError(file, '67', err, false);
        }
    } 
}
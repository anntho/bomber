const mysql = require('mysql');
const config = require('../bin/config');
const usersLibPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

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

    },
    challenge: async (data, socket) => {
        
    }
}
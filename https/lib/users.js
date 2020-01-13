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
            let userId = socket.request.session.user.id;
            let userToFollowId = data.userId;

            let proc = 'CALL sp_InsertFollower(?, ?)';
            let inputs = [userToFollowId, userId];

            await procHandler(usersLibPool, proc, inputs);
        }
    }
}
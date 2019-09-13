const mysql = require('mysql');
const config = require('../bin/config');
const metricsPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { sendEmail } = require('./email');
const { reportError } = require('./errors');

const line = '---------------------------------';
const file = 'lib/metrics.js';

module.exports = {
    getUsers: async (socket) => {
        try {
			let results = await procHandler(metricsPool, 'CALL sp_GetAllUsers()', null);
			socket.emit('getUsers', results);
		} catch (err) {
			reportError(file, '17', err, true);
			socket.emit('err', {error: err});
		}
    }
}
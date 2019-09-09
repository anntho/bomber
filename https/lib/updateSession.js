const mysql = require('mysql');
const config = require('../bin/config');
const updateSessionPool = mysql.createPool(config.mysql);
const { procHandler } = require('./sql');
const users = require('./updateSession');

module.exports = {
    updateSession: async (id, socket) => {
        const proc = 'CALL sp_GetUserById(?)';
        const inputs = [id];
        const result = await procHandler(updateSessionPool, proc, inputs);
        if (result && result[0]) {
            console.log('saving session');
            socket.request.session.user.username = result[0].username;
            socket.request.session.user.changedUsername = result[0].changedUsername;
            socket.request.session.save();
            console.log('updated session');
            console.log(socket.request.session.user);
        }
    }
}
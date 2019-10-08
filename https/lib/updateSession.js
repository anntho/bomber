const mysql = require('mysql');
const config = require('../bin/config');
const updateSessionPool = mysql.createPool(config.mysql);
const { procHandler } = require('./sql');

module.exports = {
    updateSession: async (id, socket) => {
        const proc = 'CALL sp_GetUserById(?)';
        const inputs = [id];
        const result = await procHandler(updateSessionPool, proc, inputs);
        if (result && result[0]) {
            socket.request.session.user = result[0];
            socket.request.session.save();
        }
    },
    updateSessionHTTP: async (request) => {
        const proc = 'CALL sp_GetUserById(?)';
        const inputs = [request.session.user.id];
        const result = await procHandler(updateSessionPool, proc, inputs);
        if (result && result[0]) {
            request.session.user = result[0];
            request.session.save();
        }
    }
}
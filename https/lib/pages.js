const mysql = require('mysql');
const config = require('../bin/config');
const pagesPool = mysql.createPool(config.mysql);
const { Article } = require('../models/models');
const { procHandler, procHandler2 } = require('../lib/sql');

module.exports = {
    siteMetrics: async () => {
        try {
            let newUsers = [];
            let getNewUsers = await procHandler(pagesPool, 'CALL sp_GetNewUsers()', null);
            newUsers = getNewUsers.map(x => x.username);
            return {
                newUsers: newUsers
            };
        } catch (err) {
            throw err;
        }
    },
    getScores: async () => {
        try {
            const proc = 'CALL sp_Leaderboard()';
            const results = await procHandler(pagesPool, proc, null);
            return results;
        } catch (err) {
            throw err;
        }
    },
    verifyEmail: async (raw) => {
        try {
            let result = -1;
            let ascii = Buffer.from(raw, 'base64').toString('ascii');
            let email = ascii.split(':')[0];
            let code = ascii.split(':')[1];
            let regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
            let regexMatch = email.toUpperCase().match(regex);
            console.log('verification request', code, email);
            if (code && code.length === 32 && email && regexMatch) {
                console.log('matched')
                const proc = 'CALL sp_VerifyEmail(?, ?)';
                const inputs = [email, code];
                const response = await procHandler(pagesPool, proc, inputs);
                result = response[0].result;
            }

            return result;
        } catch (err) {
            throw err;
        }
    },
    lookupCode: async (code) => {
        try {
            let proc = 'CALL sp_LookupCode(?)';
            let inputs = [code];
            let result = await procHandler(pagesPool, proc, inputs);
            return result;
        } catch (err) {
            throw err;
        }
    }
}
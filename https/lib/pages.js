const mysql = require('mysql');
const config = require('../bin/config');
const pagesPool = mysql.createPool(config.mysql);
const Article = require('../models/article');
const { procHandler, procHandler2 } = require('../lib/sql');

module.exports = {
    siteMetrics: async () => {
        try {
            let newUsers = [];
            let obj = {};
            let getNewUsers = await procHandler(pagesPool, 'CALL sp_GetNewUsers()', null);
            let siteMetrics = await procHandler2(pagesPool, 'CALL sp_SiteMetrics()', null);
            let articles = await Article.find({}).exec();
            let bomberTotal = siteMetrics[0].find(m => m.mode === 'bomber');
            let classicTotal = siteMetrics[0].find(m => m.mode === 'classic');
            let triviaTotal = siteMetrics[0].find(m => m.mode === 'trivia');
            let usersTotal = siteMetrics[1][0];
            newUsers = getNewUsers.map(x => x.username);
            obj = {
                bomber: (bomberTotal) ? bomberTotal.total : 0,
                classic: (classicTotal) ? classicTotal.total : 0,
                trivia: (triviaTotal) ? triviaTotal.total : 0,
                articles: articles.length || 0,
                users: (usersTotal) ? usersTotal.total : 0,
                newUsers: newUsers
            }
            return obj;
        } catch (err) {
            throw err;
        }
    },
    getArticles: async () => {
        try {
            const results = await Article.find({}).sort({date: -1}).exec();
            return results;
        } catch (err) {
            throw err;
        }
    },
    getArticle: async (id) => {
        try {
            const results = await Article.findOne({id: id}).exec();
            return results;
        } catch (err) {
            throw err;
        }
    },
    getQuestions: async () => {
        try {
            const proc = 'CALL sp_GetQuestions()';
            const results = await procHandler(pagesPool, proc, null);
            return results;
        } catch (err) {
            throw err;
        }
    },
    getScores: async () => {
        try {
            const proc = 'CALL sp_GetAllScores()';
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
            
            if (code && code.length === 32 && email && regexMatch) {
                const proc = 'CALL sp_VerifyEmail(?, ?)';
                const inputs = [email, code];
                const response = await procHandler(pagesPool, proc, inputs);
                result = response[0].result;
            }

            return result;
        } catch (err) {
            throw err;
        }
    }
}
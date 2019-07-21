const session = require('express-session');
const store = require('express-mysql-session')(session);
const config = require('./config');

module.exports = session({
    key: config.session.key,
    secret: config.session.secret,
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 18000000
    },
    store: new store(config.mysql)
});
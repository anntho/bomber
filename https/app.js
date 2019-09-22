const express = require('express');
const app = express();
const path = require('path');
const logger = require('morgan');
const compression = require('compression');
const favicon = require('serve-favicon');
const flash = require('connect-flash');
const helmet = require('helmet');

app.use(compression());
app.use(helmet());

const config = require('./bin/config');
const session = require('./bin/session');
const { catch404, errorHandler } = require('./lib/errors');
const socket = `${config.socket.host}:${config.socket.port}`;

// MongoDB Connection to Atlas
const mongoose = require('mongoose');
mongoose.connect(config.atlas.URI, {useNewUrlParser: true});

// Require Routes
const dataRouter = require('./routes/data');
const pagesRouter = require('./routes/pages');
const socketsRouter = require('./routes/sockets');
const usersRouter = require('./routes/users');
const accountsRouter = require('./routes/accounts');
const gamesRouter = require('./routes/games');

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Express Session
app.use(session);

// Connect Flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.env = process.env.NODE_ENV || 'development';
	res.locals.socket = socket;
	res.locals.game = false;
	res.locals.user = false;
	res.locals.file = '';
	res.locals.username = '';
	res.locals.userId = '';
	next();
});

// Serve Favicon
app.use(favicon(path.join(__dirname, 'public/icon', 'favicon.png')));

// Static Folders
app.use(express.static(path.join(__dirname, 'public')));

// Attach Routes
app.use('/', pagesRouter);
app.use('/game', gamesRouter);
app.use('/data', dataRouter);
app.use('/sockets', socketsRouter);
app.use('/@', usersRouter);
app.use('/account', accountsRouter);

// Error Handling
app.use(catch404);
app.use(errorHandler);

module.exports = app;
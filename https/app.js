const express = require('express');
const app = express();
const path = require('path');
const logger = require('morgan');
const compression = require('compression');
const favicon = require('serve-favicon');
const flash = require('connect-flash');

app.use(compression());

const config = require('./bin/config');
const session = require('./bin/session');
const { catch404, errorHandler } = require('./lib/errors');

// MongoDB Connection to Atlas
const mongoose = require('mongoose');
mongoose.connect(config.atlas.URI, {useNewUrlParser: true});

// Require Routes
const dataRoute = require('./routes/data');
const pagesRoute = require('./routes/pages');
const socketsRoute = require('./routes/sockets');
const usersRoute = require('./routes/users');
const accountsRoute = require('./routes/accounts');

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
	next();
});

// Serve Favicon
app.use(favicon(path.join(__dirname, 'public/icon', 'favicon.png')));

// Static Folders
app.use(express.static(path.join(__dirname, 'public')));

// Attach Routes
app.use('/', pagesRoute);
app.use('/data', dataRoute);
app.use('/sockets', socketsRoute);
app.use('/@', usersRoute);
app.use('/account', accountsRoute);

// Error Handling
app.use(catch404);
app.use(errorHandler);

module.exports = app;
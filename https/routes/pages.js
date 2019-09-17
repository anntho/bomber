const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const swearjar = require('swearjar');
const config = require('../bin/config');
const socket = `${config.socket.host}:${config.socket.port}`;
const Article = require('../models/article');
const pagesPool = mysql.createPool(config.mysql);
const { procHandler, procHandler2 } = require('../lib/sql');
const { authenticated } = require('../bin/auth');
const { reportError } = require('../lib/errors');
const file = 'routes/pages.js';

router.get('/live', authenticated, (req, res) => {
	if (!req.session.user) {
		res.redirect('/');
	}
	
	res.render('live', {
		user: req.session.user || null,
		socket: socket
	});
});

router.get('/', async (req, res) => {
	let newUsers = [];
	let totals = {};
	try {
		let getNewUsers = await procHandler(pagesPool, 'CALL sp_GetNewUsers()', null);
		let siteMetrics = await procHandler2(pagesPool, 'CALL sp_SiteMetrics()', null);
		let articles = await Article.find({}).exec();
		let bomberTotal = siteMetrics[0].find(m => m.mode === 'bomber');
		let classicTotal = siteMetrics[0].find(m => m.mode === 'classic');
		let triviaTotal = siteMetrics[0].find(m => m.mode === 'trivia');
		let usersTotal = siteMetrics[1][0];
		totals = {
			bomber: (bomberTotal) ? bomberTotal.total : 0,
			classic: (classicTotal) ? classicTotal.total : 0,
			trivia: (triviaTotal) ? triviaTotal.total : 0,
			articles: articles.length || 0,
			users: (usersTotal) ? usersTotal.total : 0
		}
		newUsers = getNewUsers.map(x => x.username);
	} catch (err) {
		console.log(err);
	}
	res.render('land', {
		user: req.session.user || null,
		newUsers: newUsers || null,
		metrics: totals,
		socket: socket
	});
});

router.get('/bomber', (req, res) => {
	let username = null;
	let userId = null;
	if (req.session.user) {
		username = req.session.user.username;
		userId = req.session.user.id;
	}
	res.render('bomber', {
		user: req.session.user || null,
		username: username,
		userId: userId,
		socket: socket
	});
});

router.get('/classic', (req, res) => {
	let username = null;
	let userId = null;
	if (req.session.user) {
		username = req.session.user.username;
		userId = req.session.user.id;
	}
	res.render('classic', {
		user: req.session.user || null,
		username: username,
		userId: userId,
		socket: socket
	});
});

router.get('/trivia', async (req, res) => {
	let username = null;
	let userId = null;
	if (req.session.user) {
		username = req.session.user.username;
		userId = req.session.user.id;
	}
	try {
		let questions = await procHandler(pagesPool, 'CALL sp_GetQuestions()', null);
		res.render('trivia', {
			user: req.session.user || null,
			username: username,
			userId: userId,
			socket: socket,
			questions: questions
		});
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

router.get('/login', (req, res) => {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('login', {
			socket: socket,
			user: null
		});
	}
});

router.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/login');
	});
});

router.get('/register', (req, res) => {
	if (req.session.user) {
		res.redirect('/home');
	} else {
		res.render('register', {
			socket: socket,
			user: null
		});
	}
});

router.get('/gameover', (req, res) => {
	res.render('gameover', {
		user: req.session.user || null
	});
});

router.get('/board', async (req, res) => {
	try {
		let results = await procHandler(pagesPool, 'CALL sp_GetAllScores', null);
		res.render('board', {
			user: req.session.user || null,
			scores: results,
			socket: socket
		});
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

router.get('/blog', (req, res) => {
	Article.find({}).sort({date: -1}).exec(function(err, docs) {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		} else {
			res.render('blog', {
				user: req.session.user || null,
				docs: docs,
				socket: socket
			});
		}
	})
});

router.get('/article/:id', (req, res) => {
	Article.findOne({id: req.params.id}, function(err, doc) {
		if (err) {
			console.log(err);
			res.sendStatus(500);
		} else { 
			res.render('article', {
				user: req.session.user || null,
				doc: doc
			});
		}
	});
});

router.get('/about', (req, res) => {
	res.render('about', {
		user: req.session.user || null,
		socket: socket
	});
});

router.get('/terms', (req, res) => {
	res.render('terms', {
		user: req.session.user || null,
		socket: socket
	});
});

router.get('/privacy', (req, res) => {
	res.render('privacy', {
		user: req.session.user || null,
		socket: socket
	});
});

router.get('/verify', async (req, res) => {
	console.log('verify route');
	if (req.session.user && req.session.user.verified) {
		console.log('user already verified', req.session.user.email);
		res.redirect('/account/preferences');
	} else if (req.query.v) {
		console.log('request for verification');
		try {
			let raw = req.query.v;
			let ascii = Buffer.from(raw, 'base64').toString('ascii');
			let email = ascii.split(':')[0];
			let code = ascii.split(':')[1];
			let regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/;
			let regexMatch = email.toUpperCase().match(regex);
			
			if (code && code.length === 32 && email && regexMatch) {
				try {
					let proc = 'CALL sp_VerifyEmail(?, ?)';
					let inputs = [email, code];
					let response = await procHandler(pagesPool, proc, inputs);
					//console.log('verification response');
					//console.log(response);

					if (response && response[0]) {
						res.render('verify', {
							user: req.session.user || null,
							status: response[0].result
						});
					} else {
						reportError(file, '227', response, true);
						res.sendStatus(500);
					}
				} catch (err) {
					throw err;
				}
			}
		} catch (err) {
			reportError(file, '234', err, true);
			res.sendStatus(500);
		}
	} else {
		res.redirect('/');
	}
});

module.exports = router;
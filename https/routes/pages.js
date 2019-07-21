const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const swearjar = require('swearjar');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('../bin/config');
const socket = `${config.socket.host}:${config.socket.port}`;

// Mongoose Models
const Article = require('../models/article');

// MySQL Config
const pagesPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');

// Security
router.use(helmet());
const limiter = new rateLimit({
	windowMs: 1*60*1000,
	max: 2,
	delayMs: 0
});

// Authentication Middleware
const { authenticated } = require('../bin/auth');

router.get('/live', authenticated, (req, res) => {
	if (!req.session.user) {
		res.redirect('/');
	}
	
	res.render('live', {
		user: req.session.user || null,
		socket: socket
	});
});

router.get('/', (req, res) => {
	res.render('land', {
		user: req.session.user || null
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
	res.render('classic', {
		user: req.session.user || null
	});
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
			scores: results
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
				docs: docs
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
		user: req.session.user || null
	});
});

router.get('/terms', (req, res) => {
	res.render('terms', {
		user: req.session.user || null
	});
});

router.get('/privacy', (req, res) => {
	res.render('privacy', {
		user: req.session.user || null
	});
});

module.exports = router;
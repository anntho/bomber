const express = require('express');
const router = express.Router();
const { reportError } = require('../lib/errors');
const pages = require('../lib/pages');
const { setUser } = require('../bin/auth');
const { Game, Round } = require('../models/models');
const file = 'routes/pages.js';



router.get('/', setUser, async (req, res) => {
	try {
		res.locals.metrics = await pages.siteMetrics();
		res.locals.file = 'land';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '22', err, true);
		res.sendStatus(500);
	}
});

router.get('/board', setUser, async (req, res) => {
	try {
		res.locals.scores = await pages.getScores();
		res.locals.file = 'board';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '33', err, true);
		res.sendStatus(500);
	}
});

router.get('/blog', setUser, async (req, res) => {
	try {
		res.locals.articles = await pages.getArticles();
		res.locals.file = 'blog';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '44', err, true);
		res.sendStatus(500);
	}
});

router.get('/trivia', setUser, async (req, res) => {
	try {
		res.locals.questions = await pages.getQuestions();
		res.locals.file = 'trivia';
		res.locals.game = true;
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '56', err, true);
		res.sendStatus(500);
	}
});

router.get('/article/:id', setUser, async (req, res) => {
	try {
		res.locals.article = await pages.getArticle(req.params.id);
		res.locals.file = 'article';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '67', err, true);
		res.sendStatus(500);
	}
});

router.get('/live/:id', setUser, async (req, res) => {
	try {
		let room = req.params.id;
		let game = await Game.findOne({room: room});
		if (!game) {
			res.redirect('/');
		} else {
			res.locals.game = game;
			res.locals.file = 'live';
			res.locals.game = true;
			res.render(res.locals.file);
		}
	} catch (err) {
		res.redirect('/');
	}
});

router.get('/win', (req, res) => {
	res.send('you win!');
});

router.get('/lose', (req, res) => {
	res.send('you lose!');
});

router.get('/bomber', setUser, (req, res) => {
	res.locals.file = 'bomber';
	res.locals.game = true;
	res.render(res.locals.file);
});

router.get('/classic', setUser, (req, res) => {
	res.locals.file = 'classic';
	res.locals.game = true;
	res.render(res.locals.file);
});

router.get('/terms', setUser, (req, res) => {
	res.locals.file = 'terms';
	res.render(res.locals.file);
});

router.get('/privacy', setUser, (req, res) => {
	res.locals.file = 'privacy';
	res.render(res.locals.file);
});

router.get('/login', (req, res) => {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.locals.file = 'login';
		res.render(res.locals.file);
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
		res.locals.file = 'register';
		res.render(res.locals.file);
	}
});

router.get('/verify', setUser, async (req, res) => {
	if (req.session.user && req.session.user.verified) {
		res.redirect('/account/preferences');
	} else if (req.query.v) {
		try {
			res.locals.status = await pages.verifyEmail(req.query.v);
			res.locals.file = 'verify';
			res.render(res.locals.file);
		} catch (err) {
			reportError(file, '136', err, true);
			res.sendStatus(500);
		}
	} else {
		res.redirect('/');
	}
});

router.get('/broken', (req, res) => {
	throw new Error('BROKEN');
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { reportError } = require('../lib/errors');
const pages = require('../lib/pages');
const file = 'routes/pages.js';

function setUser(req, res, next) {
	if (req.session.user) {
		res.locals.user = true;
		res.locals.username = req.session.user.username;
		res.locals.userId = req.session.user.id;
	}
	next();
}

router.get('/', async (req, res) => {
	try {
		res.locals.metrics = await pages.siteMetrics();
		res.render('land', res.locals);
	} catch (err) {
		reportError(file, '21', err, true);
		res.sendStatus(500);
	}
});

router.get('/board', async (req, res) => {
	try {
		res.locals.scores = await pages.getScores();
		res.render('board', res.locals);
	} catch (err) {
		reportError(file, '31', err, true);
		res.sendStatus(500);
	}
});

router.get('/blog', async (req, res) => {
	try {
		res.locals.articles = await pages.getArticles();
		res.render('blog', res.locals);
	} catch (err) {
		reportError(file, '41', err, true);
		res.sendStatus(500);
	}
});

router.get('/trivia', async (req, res) => {
	try {
		res.locals.questions = await pages.getQuestions();
		res.render('trivia', res.locals);
	} catch (err) {
		reportError(file, '51', err, true);
		res.sendStatus(500);
	}
});

router.get('/article/:id', async (req, res) => {
	try {
		res.locals.article = await pages.getArticle(req.params.id);
		res.render('article', res.locals);
	} catch (err) {
		reportError(file, '61', err, true);
		res.sendStatus(500);
	}
});

router.get('/bomber', setUser, (req, res) => {
	res.render('bomber', res.locals);
});

router.get('/classic', setUser, (req, res) => {
	res.render('classic', res.locals);
});

router.get('/about', setUser, (req, res) => {
	res.render('about', res.locals);
});

router.get('/terms', setUser, (req, res) => {
	res.render('terms', res.locals);
});

router.get('/privacy', setUser, (req, res) => {
	res.render('privacy', res.locals);
});

router.get('/login', (req, res) => {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('login', res.locals);
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
		res.render('register', res.locals);
	}
});

router.get('/verify', async (req, res) => {
	if (req.session.user && req.session.user.verified) {
		res.redirect('/account/preferences');
	} else if (req.query.v) {
		try {
			res.locals.result = await pages.verifyEmail(req.query.v);
			res.render('verify', res.locals);
		} catch (err) {
			reportError(file, '116', err, true);
			res.sendStatus(500);
		}
	} else {
		res.redirect('/');
	}
});

module.exports = router;
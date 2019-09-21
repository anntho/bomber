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
		res.locals.file = 'land';
		res.render(res.locals.file, res.locals);
	} catch (err) {
		reportError(file, '22', err, true);
		res.sendStatus(500);
	}
});

router.get('/board', async (req, res) => {
	try {
		res.locals.scores = await pages.getScores();
		res.locals.file = 'board';
		res.render(res.locals.file, res.locals);
	} catch (err) {
		reportError(file, '33', err, true);
		res.sendStatus(500);
	}
});

router.get('/blog', async (req, res) => {
	try {
		res.locals.articles = await pages.getArticles();
		res.locals.file = 'blog';
		res.render(res.locals.file, res.locals);
	} catch (err) {
		reportError(file, '44', err, true);
		res.sendStatus(500);
	}
});

router.get('/trivia', async (req, res) => {
	try {
		res.locals.questions = await pages.getQuestions();
		res.locals.file = 'trivia';
		res.locals.game = true;
		res.render(res.locals.file, res.locals);
	} catch (err) {
		reportError(file, '56', err, true);
		res.sendStatus(500);
	}
});

router.get('/article/:id', async (req, res) => {
	try {
		res.locals.article = await pages.getArticle(req.params.id);
		res.locals.file = 'article';
		res.render(res.locals.file, res.locals);
	} catch (err) {
		reportError(file, '67', err, true);
		res.sendStatus(500);
	}
});

router.get('/bomber', setUser, (req, res) => {
	res.locals.file = 'bomber';
	res.locals.game = true;
	res.render(res.locals.file, res.locals);
});

router.get('/classic', setUser, (req, res) => {
	res.locals.file = 'classic';
	res.locals.game = true;
	res.render(res.locals.file, res.locals);
});

router.get('/about', setUser, (req, res) => {
	res.locals.file = 'about';
	res.render(res.locals.file, res.locals);
});

router.get('/terms', setUser, (req, res) => {
	res.locals.file = 'terms';
	res.render(res.locals.file, res.locals);
});

router.get('/privacy', setUser, (req, res) => {
	res.locals.file = 'privacy';
	res.render(res.locals.file, res.locals);
});

router.get('/login', (req, res) => {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.locals.file = 'login';
		res.render(res.locals.file, res.locals);
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
		res.render(res.locals.file, res.locals);
	}
});

router.get('/verify', async (req, res) => {
	if (req.session.user && req.session.user.verified) {
		res.redirect('/account/preferences');
	} else if (req.query.v) {
		try {
			res.locals.result = await pages.verifyEmail(req.query.v);
			res.locals.file = 'verify';
			res.render(res.locals.file, res.locals);
		} catch (err) {
			reportError(file, '116', err, true);
			res.sendStatus(500);
		}
	} else {
		res.redirect('/');
	}
});

module.exports = router;
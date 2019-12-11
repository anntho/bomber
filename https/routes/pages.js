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
		let participant = game.players.find(p => p.userId == req.session.user.id);

		if (!game || game.status == 'closed') {
			res.redirect('/');
		} else if (game.status == 'active' && participant) {
			res.locals.game = game;
			res.locals.file = 'live';
			res.locals.game = true;
			res.render(res.locals.file);
		} else {
			res.redirect('/');
		}
	} catch (err) {
		res.redirect('/');
	}
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
		res.redirect('/');
	} else {
		res.locals.file = 'register';
		res.render(res.locals.file);
	}
});

router.get('/password/reset/verified/:code', async (req, res) => {
	console.log('param route')
	if (req.session.user) {
		res.redirect('/');
	} else {
		try {
			let code = req.params.code;
			let { success, userId } = await pages.lookupCode(code);
			console.log(code, success, userId);

			res.locals.userId = null;
			if (success == 1 && userId) {
				res.locals.userId = userId;
				res.locals.step2 = true;
				res.locals.code = code;
				res.locals.file = 'reset';
				res.render(res.locals.file);
			} else {
				return res.redirect('/password/reset');
			}
		} catch (err) {
			reportError(file, '151', err, true);
			res.sendStatus(500);
		}
	}
});

router.get('/password/reset', (req, res) => {
	console.log('plain route')
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.locals.userId = null;
		res.locals.code = null;
		res.locals.step2 = false;
		res.locals.file = 'reset';
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
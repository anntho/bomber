const express = require('express');
const router = express.Router();
const { reportError } = require('../lib/errors');
const pages = require('../lib/pages');
const { update, setUser } = require('../bin/auth');
const { Game } = require('../models/models');
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

router.get('/live/:id', [update, setUser], async (req, res) => {
	console.log('live route');
	try {
		let room = req.params.id;
		let game = await Game.findOne({room: room});
		let participant = null;
		if (req.session.user) {
			participant = game.players.find(p => p.userId == req.session.user.id);
		}

		if (game && game.status == 'closed') {
			game.status == 'closed';
			res.locals.game = game;
			res.locals.file = 'recap';
			res.render(res.locals.file);
		} else if (
			game 
			&& game.status == 'active'
			&& participant
		) {
			res.locals.game = game;
			res.locals.file = 'live';
			res.render(res.locals.file);
		} else {
			res.redirect('/');
		}
	} catch (err) {
		console.log(err);
		res.redirect('/');
	}
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
	if (req.session.user) {
		res.redirect('/');
	} else {
		try {
			let code = req.params.code;
			let result = await pages.lookupCode(code);
			console.log(result);
			if (result && result[0] && result[0].used == 0) {
				res.locals.verified = true;
				res.locals.code = result[0].code;
				res.locals.file = 'reset';
				res.render(res.locals.file);
			} else {
				res.redirect('/password/reset');
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
		res.locals.verified = false;
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
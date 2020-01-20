const express = require('express');
const router = express.Router();
const { authenticated, setUser } = require('../bin/auth');
const { reportError } = require('../lib/errors');
const users = require('../lib/users');
const file = 'routes/accounts.js';

router.get('/preferences', [authenticated, setUser], async (req, res) => {
	try {
		res.locals.file = 'preferences';
		res.locals.verified = req.session.user.verified;
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '14', err, false);
		res.sendStatus(500);
	}
});

router.get('/inbox/:id', [authenticated, setUser], async (req, res) => {
	try {
		let sid = req.params.id;
		await users.markRead(res.locals.userId, sid);
		res.locals.sid = sid;
		res.locals.file = 'convo';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '27', err, false);
		res.sendStatus(500);
	}
});

router.get('/inbox', [authenticated, setUser], async (req, res) => {
	try {
		let inbox = await users.getInbox(res.locals.userId);
		let SIDS = inbox[0].map(i => i.sid);
		let uniqueSIDS = [...new Set(SIDS)];
		let slim = [];
		for (const i of uniqueSIDS) {
			let newest = inbox[0].find(m => m.sid == i);
			newest.new = false;
			if (newest && newest.read == 0) {
				if (newest.sender != res.locals.userId) {
					newest.new = true;
				}
			}
			slim.push(newest);
		}
		res.locals.inbox = slim;
		res.locals.file = 'inbox';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '53', err, false);
		res.sendStatus(500);
	}
});

router.get('/profile', [authenticated, setUser], async (req, res) => {
	try {
		res.redirect('/@/' + req.session.user.username);
	} catch (err) {
		reportError(file, '62', err, false);
		res.sendStatus(500);
	}
});

module.exports = router;
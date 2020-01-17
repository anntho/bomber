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
		console.log('HIT', sid);
		let messages = await users.getMessages(sid);
		res.locals.messages = messages;
		res.locals.file = 'convo';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '23', err, false);
		res.sendStatus(500);
	}
});

router.get('/inbox', [authenticated, setUser], async (req, res) => {
	try {
		let inbox = await users.getInbox(res.locals.userId);
		let uniqueList = inbox[0];
		for (const unique of uniqueList) {
			let newest = inbox[1].find(m => m.sender == unique.sender);
			let unread = inbox[1].filter(m => (m.sender == unique.sender) && m.read == 0);
			unique.message = newest.message;
			unique.read = newest.read;
			unique.unread = unread.length;
		}
		res.locals.inbox = inbox[0];
		res.locals.file = 'inbox';
		res.render(res.locals.file);
	} catch (err) {
		reportError(file, '45', err, false);
		res.sendStatus(500);
	}
});

router.get('/profile', [authenticated, setUser], async (req, res) => {
	try {
		res.redirect('/@/' + req.session.user.username);
	} catch (err) {
		reportError(file, '43', err, false);
		res.sendStatus(500);
	}
});

module.exports = router;
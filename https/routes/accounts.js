const express = require('express');
const router = express.Router();
const { authenticated, setUser } = require('../bin/auth');
const users = require('../lib/users');

const file = 'routes/accounts.js';

router.get('/preferences', [authenticated, setUser], async (req, res) => {
	res.locals.file = 'preferences';
	res.locals.verified = req.session.user.verified;
	res.render(res.locals.file);
});

router.get('/inbox', [authenticated, setUser], async (req, res) => {
	try {
		let messages = await users.getMessages(res.locals.userId);
		for (const message of messages[0]) {
			let mostRecent = messages[1].find(m => m.sender == message.sender);
			message.message = mostRecent.message;
			message.read = mostRecent.read;
		}
		res.locals.messages = messages[0];
		res.locals.file = 'inbox';
		res.render(res.locals.file);
	} catch (err) {
		res.sendStatus(500);
	}
});

router.get('/profile', [authenticated, setUser], async (req, res) => {
	console.log(req.session.user);
	res.redirect('/@/' + req.session.user.username);
});

module.exports = router;
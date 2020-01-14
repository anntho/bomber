const express = require('express');
const router = express.Router();
const { authenticated, setUser } = require('../bin/auth');

router.get('/preferences', [authenticated, setUser], async (req, res) => {
	res.locals.file = 'preferences';
	res.locals.verified = req.session.user.verified;
	res.render(res.locals.file);
});

router.get('/inbox', [authenticated, setUser], async (req, res) => {
	res.locals.file = 'inbox';
	res.render(res.locals.file);
});

router.get('/profile', [authenticated, setUser], async (req, res) => {
	console.log(req.session.user);
	res.redirect('/@/' + req.session.user.username);
});

module.exports = router;
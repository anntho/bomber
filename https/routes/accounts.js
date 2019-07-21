const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const socket = `${config.socket.host}:${config.socket.port}`;

const mysql = require('mysql');
const usersPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { authenticated } = require('../bin/auth');
const { sendEmail } = require('../lib/email');

router.get('/preferences', authenticated, async (req, res) => {
	res.render('preferences', {
		user: req.session.user,
		socket: socket
	});
});

router.get('/profile', authenticated, async (req, res) => {
	console.log(req.session.user);
	res.redirect('/@/' + req.session.user.username);
});

router.get('/mail', authenticated, async (req, res) => {
	sendEmail('apecs@umich.edu', 'this is a testy email');
})

module.exports = router;
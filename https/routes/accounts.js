const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const socket = `${config.socket.host}:${config.socket.port}`;

const mysql = require('mysql');
const accountsPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { authenticated } = require('../bin/auth');

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

module.exports = router;
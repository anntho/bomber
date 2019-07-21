const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler } = require('../lib/sql');

const usersPool = mysql.createPool(config.mysql);
const socket = `${config.socket.host}:${config.socket.port}`;

router.get('/verify/' + config.AA + '/:code', (req, res) => {
	
});

router.get('/:id', async (req, res) => {
	let username = req.params.id;
	let sql = 'CALL sp_UserGrid(?)';
	let inputs = [username];

	try {
		let grid = await procHandler(usersPool, sql, inputs);
		if (!grid[0]) {
			res.sendStatus(404);
		} else {
			console.log(grid[0]);
			res.render('profile', {
				user: req.session.user || null,
				socket: socket,
				username: username,
				grid: grid[0]
			});
		}
	} catch (err) {
		res.send(err).status(500);
	}
});

module.exports = router;
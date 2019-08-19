const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler, procHandler2 } = require('../lib/sql');

const gamePool = mysql.createPool(config.mysql);
const socket = `${config.socket.host}:${config.socket.port}`;

router.get('/:sid', async (req, res) => {
	try {
        let sid = req.params.sid;
        console.log(`looking for game ${sid}`);
        let gameProc = 'CALL moviebomber.sp_GetGameBySid(?)';
		let game = await procHandler2(gamePool, gameProc, [sid]);
		if (!game[0] || !game[1]) {
			res.render('404', {
				user: req.session.user || null,
				socket: socket
			});
		} else {
			res.render('game', {
				user: req.session.user || null,
                socket: socket,
                game: game
			});
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = router;
const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler, procHandler2 } = require('../lib/sql');
const gamePool = mysql.createPool(config.mysql);
const { setUser } = require('../bin/auth');

router.get('/:sid', setUser, async (req, res) => {
	try {
        let sid = req.params.sid;
        console.log(`looking for game ${sid}`);
        let gameProc = 'CALL moviebomber.sp_GetGameBySid(?)';
		let game = await procHandler2(gamePool, gameProc, [sid]);
		if (!game[0] || !game[1]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			res.locals.game = game;
			res.render('game');
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

module.exports = router;
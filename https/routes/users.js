const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler, procHandler2 } = require('../lib/sql');
const { setUser } = require('../bin/auth');
const { Game } = require('../models/models');

const usersPool = mysql.createPool(config.mysql);
const socket = `${config.socket.host}:${config.socket.port}`;

router.get('/:id', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let userProc = 'CALL sp_GetUser(?)';
		let userInputs = [username];
		let user = await procHandler(usersPool, userProc, userInputs);
		
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let games = await Game.find({'players': {$elemMatch: {username: username}}});
			let gamesPlayed = (games) ? games.length : 0;
			console.log(gamesPlayed)
			
			// not sure if we need to recalc this everytime
			let rankProc = 'CALL sp_GetRank(?)';
			let rankInputs = [gamesPlayed];
			let rank = await procHandler(usersPool, rankProc, rankInputs);
			console.log(rank)
			res.locals.file = 'profile';
			res.locals.games = gamesPlayed;
			res.locals.rank = rank[0];
			res.locals.thisUser = user[0];
			res.render(res.locals.file);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

function pct(a, b) {
	return Math.round((a/b) * 100);
}

module.exports = router;
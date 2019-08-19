const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler, procHandler2 } = require('../lib/sql');

const usersPool = mysql.createPool(config.mysql);
const socket = `${config.socket.host}:${config.socket.port}`;

router.get('/:id', async (req, res) => {
	let username = req.params.id;
	let userProc = 'CALL moviebomber.sp_GetUser(?)';
	let userInputs = [username];

	try {
		let user = await procHandler(usersPool, userProc, userInputs);
		if (!user[0]) {
			res.render('404', {
				user: req.session.user || null,
				socket: socket,
				username: username
			});
		} else {
			let gamesProc = 'CALL moviebomber.sp_GetUserGames(?)';
			let games = await procHandler2(usersPool, gamesProc, userInputs);
			console.log(`games for user ${username}: ${games[0].length || 0}`);

			let classic = games[1].find(x => x.mode === 'classic') || null;
			let bomber = games[1].find(x => x.mode === 'bomber') || null;
			let trivia = games[1].find(x => x.mode === 'trivia') || null;
			
			let chart = {
				classic: (classic) ? classic.total : null,
				bomber: (bomber) ? bomber.total : null,
				trivia: (trivia) ? trivia.total : null
			};

			res.render('profile', {
				user: req.session.user || null,
				socket: socket,
				username: username,
				user: user[0],
				games: games,
				chart: chart
			});
			
		}
	} catch (err) {
		console.log(err)
		res.sendStatus(500);
	}
});

module.exports = router;
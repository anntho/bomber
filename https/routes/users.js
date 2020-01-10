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

		if (res.locals.user) {
			let followerProc = 'CALL sp_GetFollowers(?)';
			let followerInputs = [res.locals.userId];
			let followers = await procHandler(usersPool, followerProc, followerInputs);
			console.log(followers);
		}
		
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let playerQuery = {'players': {$elemMatch: {username: username}}};
			let sortQuery = {created: 'desc'};
			let games = await Game.find(playerQuery).sort(sortQuery).exec();
			let closedGames = games.filter(g => g.status == 'closed');
			let slim = [];
			for (const game of closedGames) {
				let date = new Date(game._id.getTimestamp());
				let str = date.toString().split('T')[0];
				let gameUser = game.players.find(p => p.username == username);
				let gameOpponent = game.players.find(p => p.username != username);
				let userColor = 'incorrect';
				let opponentColor = 'incorrect';
				let winner = false;
				if (game.winner == user[0].id) {
					winner = true;
					userColor = 'correct';
					opponentColor = 'incorrect';
				}
				slim.push({
					room: game.room,
					date: str,
					winner: winner,
					gameUser: gameUser,
					userColor: userColor,
					gameOpponent: gameOpponent,
					opponentColor: opponentColor
				});
			}
	
			let gamesPlayed = (games && closedGames) ? closedGames.length : 0;
			
			// not sure if we need to recalc this everytime
			let rankProc = 'CALL sp_GetRank(?)';
			let rankInputs = [gamesPlayed];
			let rank = await procHandler(usersPool, rankProc, rankInputs);

			res.locals.file = 'profile';
			res.locals.gamesPlayed = gamesPlayed;
			res.locals.rank = rank[0];
			res.locals.thisUser = user[0];
			res.locals.games = slim;
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
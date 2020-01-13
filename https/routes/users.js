const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const mysql = require('mysql');
const { procHandler, procHandler2 } = require('../lib/sql');
const { setUser } = require('../bin/auth');
const { Game } = require('../models/models');

const usersPool = mysql.createPool(config.mysql);
const socket = `${config.socket.host}:${config.socket.port}`;

router.get('/:id/followers', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let userProc = 'CALL sp_GetUser(?)';
		let userInputs = [username];
		let user = await procHandler(usersPool, userProc, userInputs);
		
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let followerProc = 'CALL sp_GetFollowers(?)';
			let followerInputs = [user[0].id];
			let followers = await procHandler(usersPool, followerProc, followerInputs);

			res.locals.file = 'followers';
			res.locals.thisUser = user[0];
			res.locals.thisUser.followers = followers;
			res.render(res.locals.file);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

router.get('/:id/following', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let userProc = 'CALL sp_GetUser(?)';
		let userInputs = [username];
		let user = await procHandler(usersPool, userProc, userInputs);
		
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let followingProc = 'CALL sp_GetFollowing(?)';
			let followingInputs = [user[0].id];
			let following = await procHandler(usersPool, followingProc, followingInputs);

			res.locals.file = 'following';
			res.locals.thisUser = user[0];
			res.locals.thisUser.following = following;
			res.render(res.locals.file);
		}
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

router.get('/:id', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let userProc = 'CALL sp_GetUser(?)';
		let userInputs = [username];
		let user = await procHandler(usersPool, userProc, userInputs);

		// for logged in user
		if (res.locals.user) {
			let followingProc = 'CALL sp_GetFollowing(?)';
			let followingInputs = [res.locals.userId];
			let following = await procHandler(usersPool, followingProc, followingInputs);
			let isFollowing = following.find(f => f.id = user[0].id);
			res.locals.isFollowing = isFollowing;
		}
		
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let playerQuery = {'players': {$elemMatch: {username: username}}};
			let sortQuery = {created: 'desc'};
			
			let games = await Game.find(playerQuery).sort(sortQuery).exec();
			let activeGame = games.filter(g => g.status == 'active');
			let closedGames = games.filter(g => g.status == 'closed');
			let slim = [];
			
			for (const game of closedGames) {
				let date = new Date(game._id.getTimestamp());
				let str = date.toString().split('T')[0];
				let mode = `${game.parameters.count} ${game.parameters.mode}`;
				let gameUser = game.players.find(p => p.username == username);
				let gameOpponent = game.players.find(p => p.username != username);
				let userColor = 'incorrect';
				let opponentColor = 'incorrect';
				let winner = false;
				if (game.outcome.winner == user[0].id) {
					winner = true;
					userColor = 'correct';
					opponentColor = 'incorrect';
				}
				slim.push({
					room: game.room,
					mode: mode,
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

			let followerProc = 'CALL sp_GetFollowers(?)';
			let followerInputs = [user[0].id];
			let followers = await procHandler(usersPool, followerProc, followerInputs);
			console.log(followers)

			let followingProc = 'CALL sp_GetFollowing(?)';
			let followingInputs = [user[0].id];
			let following = await procHandler(usersPool, followingProc, followingInputs);

			res.locals.file = 'profile';
			res.locals.thisUser = user[0];
			res.locals.thisUser.followers = followers;
			res.locals.thisUser.following = following;
			res.locals.thisUser.gamesPlayed = gamesPlayed;
			res.locals.thisUser.activeGame = activeGame[0];
			res.locals.thisUser.rank = rank[0];
			res.locals.thisUser.games = slim;

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
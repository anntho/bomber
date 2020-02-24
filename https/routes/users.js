const express = require('express');
const router = express.Router();
const users = require('../lib/users');
const { reportError } = require('../lib/errors');
const { setUser } = require('../bin/auth');
const file = 'routes/users.js';

router.get('/:id/followers', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let user = await users.getUser(username);
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let userId = user[0].id;
			let followers = await users.getFollowers(userId);
			res.locals.file = 'followers';
			res.locals.thisUser = user[0];
			res.locals.thisUser.followers = followers;
			res.render(res.locals.file);
		}
	} catch (err) {
		reportError(file, '26', err, false);
		res.sendStatus(500);
	}
});

router.get('/:id/following', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let user = await users.getUser(username);
		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let userId = user[0].id;
			let following = await users.getFollowing(userId);
			res.locals.file = 'following';
			res.locals.thisUser = user[0];
			res.locals.thisUser.following = following;
			res.render(res.locals.file);
		}
	} catch (err) {
		reportError(file, '47', err, false);
		res.sendStatus(500);
	}
});

router.get('/:id', [setUser], async (req, res) => {
	try {
		let username = req.params.id;
		let user = await users.getUser(username);

		if (!user[0]) {
			res.locals.file = '404';
			res.render(res.locals.file);
		} else {
			let userId = user[0].id;
			let { active, total, slim } = await users.getGames(userId);

			let rank = await users.getRank(total, userId);
			let followers = await users.getFollowers(userId);
			let following = await users.getFollowing(userId);
			let restrictions = await users.getRestrictions(userId);

			// For logged in users...
			let isFollowing = null;
			if (res.locals.userId) {
				let following = await users.getFollowing(res.locals.userId);
				isFollowing = following.find(f => f.id = user[0].id);

				let myRestrictions = await users.getRestrictions(res.locals.userId);
				let blocked = myRestrictions.find(r => r.blockedUserId == userId);
				res.locals.blocked = !!blocked;

				let restricted = restrictions.find(r => r.blockedUserId == res.locals.userId);
				res.locals.restricted = !!restricted;
			}

			res.locals.file = 'profile';
			res.locals.thisUser = user[0];
			res.locals.thisUser.followers = followers;
			res.locals.thisUser.following = following;
			res.locals.thisUser.total = total;
			res.locals.thisUser.activeGame = active;
			res.locals.thisUser.rank = rank[0];
			res.locals.thisUser.games = slim;
			res.locals.isFollowing = isFollowing;
			res.render(res.locals.file);
		}
	} catch (err) {
		reportError(file, '85', err, false);
		res.sendStatus(500);
	}
});

module.exports = router;
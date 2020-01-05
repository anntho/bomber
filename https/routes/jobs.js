const express = require('express');
const router = express.Router();
const config = require('../bin/config');
const { reportError } = require('../lib/errors');
const { Game } = require('../models/models');
const { checkExpired } = require('../lib/games');
const file = 'routes/jobs.js';

router.get(`/${config.auth.AA}/expire`, async (req, res) => {
	try {
        res.sendStatus(200);
        let games = await Game.find({status: {$in: ['active', 'open']}});
        if (games) {
            for (const game of games) {
                await checkExpired(game);
            }
        }
	} catch (err) {
		reportError(file, '18', err, true);
		res.sendStatus(500);
	}
});

module.exports = router;
const express = require('express');
const router = express.Router();
const fs = require('fs');
const mysql = require('mysql');
const fetch = require('node-fetch');
const ss = require('string-similarity');

const config = require('../bin/config');
const { shuffle } = require('../lib/helpers');

// MySQL Config
const dataPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');

// API Config
const TMDB_KEY = `?api_key=${config.tmdb.key}`;
const URL_BASE = 'https://api.themoviedb.org/3';

// API Endpoints
router.get('/movie/:movieId', async (req, res) => {
	let id = req.params.movieId;
	let uri = URL_BASE + '/movie/' + id + TMDB_KEY;
	let response = await fetch(uri);
	let data = await response.json();
	res.json(data);
});

router.get('/movie/cast/:movieId', async (req, res) => {
	let id = req.params.movieId;
	let uri = URL_BASE + '/movie/' + id + '/credits' + TMDB_KEY;
	let response = await fetch(uri);
	let data = await response.json();
	res.json(data.cast);
});

router.get('/movies/cast/:movieId/:guess', async (req, res) => {
	let id = req.params.movieId;
	let uri = URL_BASE + '/movie/' + id + '/credits' + TMDB_KEY;
	let guess = req.params.guess;
	let isMatch = false;
	let ratio;
	let response = await fetch(uri);
	let data = await response.json();
	let cast = data.cast;
	
	cast.forEach((element) => {
		if (ss.compareTwoStrings(guess, element.name) >= .8) {
			isMatch = true;
			return false;
		}
	});
	res.json({'isMatch': isMatch});
});

router.get('/person/credits/:personId', async (req, res) => {
	let id = req.params.personId;
	let uri = URL_BASE + '/person/' + id + '/movie_credits' + TMDB_KEY;
	let response = await fetch(uri);
	let data = await response.json();
	let creditsArray = data.cast;

	res.json(creditsArray);
});

router.get('/person/:personId', async (req, res) => {
	let id = req.params.personId;
	let uri = URL_BASE + '/person/' + id + TMDB_KEY;
	let response = await fetch(uri);
	let data = await response.json();
	res.json(data);
});

// Database Endpoints
router.get('/actor_list', async (req, res) => {
	try {
		let results = await procHandler(dataPool, 'CALL sp_GetAllActors()', null);
		res.json(results);
	} catch (err) {
		console.log(err);
		res.sendStatus(500);
	}
});

router.get('/movie_list', async (req, res) => {
	try {
		let results = await procHandler(dataPool, 'CALL sp_GetAllMovies()', null);
		res.json(results);
	} catch (err) {
		console.log(err)
		res.sendStatus(500);
	}
});

module.exports = router;
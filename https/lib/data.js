const mysql = require('mysql');
const fetch = require('node-fetch');
const config = require('../bin/config');
const dataPool = mysql.createPool(config.mysql);
const { procHandler } = require('../lib/sql');
const { reportError } = require('./errors');
const { Movie } = require('../models/models');

const TMDB_KEY = `?api_key=${config.tmdb.key}`;
const URL_BASE = 'https://api.themoviedb.org/3';

const file = 'lib/data.js';

module.exports = {
    movieList: async (socket) => {
		try {
			let results = await procHandler(dataPool, 'CALL sp_GetAllMovies()', null);
			socket.emit('movieList', results);
		} catch (err) {
			reportError(file, '21', err, true);
			socket.emit('err', {error: err});
		}
    },
    actorList: async (socket) => {
		try {
			let results = await procHandler(dataPool, 'CALL sp_GetAllActors()', null);
			socket.emit('actorList', results);
		} catch (err) {
			reportError(file, '30', err, true);
			socket.emit('err', {error: err});
		}
    },
    starters: async (socket) => {
        try {
			let movies = await procHandler(dataPool, 'CALL sp_GetAllMovies()', null);
			let actors = await procHandler(dataPool, 'CALL sp_GetAllActors()', null);
			socket.emit('starters', {
				movies: movies,
				actors: actors
			});
		} catch (err) {
			reportError(file, '43', err, true);
			socket.emit('err', {error: err});
		}
    },
    getMovie: async (id, socket) => {
		if (id) {
		    try {
				let uri = URL_BASE + '/movie/' + id + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getMovie', data);
			} catch (err) {
                reportError(file, '55', err, true);
				socket.emit('err', {error: err});
			}
		}
    },
    getCast: async (id, socket) => {
		if (id) {
			try {
				let uri = URL_BASE + '/movie/' + id + '/credits' + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getCast', data);
			} catch (err) {
                reportError(file, '68', err, true);
				socket.emit('err', {error: err});
			}
		}
    },
    getCredits: async (id, socket) => {
		if (id) {
			try {
				let uri = URL_BASE + '/person/' + id + '/movie_credits' + TMDB_KEY;
				let response = await fetch(uri);
				let data = await response.json();
				socket.emit('getCredits', data);
			} catch (err) {
                reportError(file, '81', err, true);
				socket.emit('err', {error: err});
			}
		}
    },
    getQuestions: async () => {
        try {
			let questions = await procHandler(dataPool, 'CALL sp_GetQuestions()', null);
			socket.emit('getQuestions', questions);
		} catch (err) {
            reportError(file, '91', err, true);
			socket.emit('err', {error: err});
		}
	},
	getMovieDocs: async (socket, id) => {
		try {
			let list = await Movie.find({'lists.altId': id});
			socket.emit('getMovieDocs', list);
		} catch (err) {
			reportError(file, '101', err, true);
			socket.emit('err', {error: err});
		}
	},
	getAllMovies: async (socket) => {
		try {
			let movies = await Movie.find();
			if (movies && movies.length) {
				socket.emit('getAllMovies', movies);
			}
		} catch (err) {
			reportError(file, '110', err, false);
			socket.emit('err', { 
				error: err
			});
		}
	}
}
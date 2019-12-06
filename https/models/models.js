let mongoose = require('mongoose');

let articleSchema = new mongoose.Schema({
	id: String,
	date: Date,
	author: String,
	title: String,
	desc: String,
	content: String
});

let movieSchema = new mongoose.Schema({
	correct: [String],
	incorrect: [String],
	list: String,
	listID: String,
	title: String,
	altId: String,
	overview: String
});

let gameSchema = new mongoose.Schema({
	room: String,
	status: String,
	time: Number,
	index: Number,
	cIndex: Number,
	list: [
		{
			id: String,
			winner: { type: Number, default: null },
			guesses: [Number]
		}
	],
	players: [
		{
			username: String,
			userId: Number,
			socketId: String,
			score: { type: Number, default: 0 },
			rank: String,
			level: String
		}
	]
});

module.exports = {
	Article: mongoose.model('article', articleSchema),
	Movie: mongoose.model('movie', movieSchema),
	Game: mongoose.model('game', gameSchema)
}
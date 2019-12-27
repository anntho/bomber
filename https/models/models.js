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
	created: { type: Date, default: Date.now },
	parameters: {
		mode: String,
		count: Number,
		listId: String
	},
	winner: Number,
	index: Number,
	cIndex: Number,
	list: [String],
	turns: [
		{
			id: String,
			guesses: {
				correct: Number,
				incorrect: [Number]
			}
		}
	],
	players: [
		{
			username: String,
			userId: Number,
			socketId: String,
			score: { type: Number, default: 0 },
			rank: String,
			elo: Number,
			new: {
				elo: Number,
				points: Number
			}
		}
	]
});

module.exports = {
	Article: mongoose.model('article', articleSchema),
	Movie: mongoose.model('movie', movieSchema),
	Game: mongoose.model('game', gameSchema)
}
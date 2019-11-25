let mongoose = require('mongoose');

let articleSchema = new mongoose.Schema({
	id: String,
	date: Date,
	author: String,
	title: String,
	desc: String,
	content: String
});

let roundSchema = new mongoose.Schema({
	correct: [String],
	incorrect: [String],
	list: String,
	listID: String,
	title: String,
	overview: String
});

let gameSchema = new mongoose.Schema({
	room: String,
	status: String,
	index: Number,
	cIndex: Number,
	list: [String],
	players: [
		{
			username: String,
			userId: Number,
			socketId: String,
			score: Number,
			rank: String,
			level: String
		}
	]
});

module.exports = {
	Article: mongoose.model('article', articleSchema),
	Round: mongoose.model('round', roundSchema),
	Game: mongoose.model('game', gameSchema)
}
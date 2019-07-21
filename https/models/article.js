let mongoose = require("mongoose");

let schema = new mongoose.Schema({
	id: String,
	date: Date,
	author: String,
	title: String,
	desc: String,
	content: String
});

module.exports = mongoose.model("article", schema);
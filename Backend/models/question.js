const mongoose = require('mongoose');

let question = new mongoose.Schema({
    answer: {type: String, required: true},
    image: {data: Buffer, url: String, contentType: String},
    desc: {type: String, unique: true, index: true}
});

module.exports = mongoose.model('question', question);
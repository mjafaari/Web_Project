const mongoose = require('mongoose');


let room = new mongoose.Schema({
    room_id: {type: String, required: true, index: true},
    first_player_info: {
        username: {type: String, required: true},
        index: {type: Number, default: 0},
        score: {type: Number, default: 0},
        last_admit: {type: Date}
    },
    second_player_info: {
        username: {type: String, required: true},
        index: {type: Number, default: 0},
        score: {type: Number, default: 0},
        last_admit: {type: Date}
    },
    questions: [String],
    answers: [String],
    result: {type: String, default: ''}
});

module.exports = mongoose.model('room', room);
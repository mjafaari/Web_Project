const mongoose = require('mongoose');
const cfg = require('../utils/configs');

let profile_show = new mongoose.Schema({
    username: {type: String, required: true},
    name: String,
    avatar: {type: Number, required: true}
});

let profile = new mongoose.Schema({
    count: {type: Number, default: 1},
    show: {type: profile_show},
    flag: {type: Number, default: 0},
    win_strike: {type: Number, default: 0},
    level: {type: Number, default: 0},
    experience: {type: Number, default: 0},
    average_score: {type: Number, default: 0},
    game_number: {type: Number, default: 0},
    won_number: {type: Number, default: 0},
    gem: {type: Number, default: cfg.BASE_GEM},
    coins: {type: Number, default: cfg.BASE_COIN},
    friends: [profile_show]
});

module.exports = mongoose.model('profile', profile);
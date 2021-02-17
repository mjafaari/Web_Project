const mongoose = require('mongoose');

let avatar = new mongoose.Schema({
    avatar_id: {type: Number, unique: true, required: true},
    price: {type: Number, required: true}
});

module.exports = mongoose.model("avatar", avatar);
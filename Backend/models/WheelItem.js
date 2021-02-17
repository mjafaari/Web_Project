const mongoose = require("mongoose");

const WheelItem = new mongoose.Schema({
    type: {type: String, required: true},
    value: {type: Number, required: true},
    owner: {type: String}
});

module.exports = mongoose.model('WheelItem', WheelItem);
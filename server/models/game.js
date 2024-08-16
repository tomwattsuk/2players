const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  maxPlayers: {
    type: Number,
    default: 2,
  },
});

module.exports = mongoose.model('Game', GameSchema);
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  game: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true,
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
});

module.exports = mongoose.model('Match', MatchSchema);
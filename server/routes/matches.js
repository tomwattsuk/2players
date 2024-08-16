const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// Create a new match
router.post('/', async (req, res) => {
  try {
    const newMatch = new Match(req.body);
    const match = await newMatch.save();
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all matches
router.get('/', async (req, res) => {
  try {
    const matches = await Match.find().populate('game').populate('players', 'username');
    res.json(matches);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
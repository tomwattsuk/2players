// server/routes/matches.js
const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// Create a new match
router.post('/', async (req, res) => {
  try {
    const { game, players } = req.body;
    const newMatch = new Match({ game, players });
    const match = await newMatch.save();
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update match status
router.put('/:id', async (req, res) => {
  try {
    const { status, winner } = req.body;
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status, winner, updatedAt: Date.now() },
      { new: true }
    );
    res.json(match);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
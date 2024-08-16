// server/routes/games.js
const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Get all games
router.get('/', async (req, res) => {
  try {
    const games = await Game.find();
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add a new game
router.post('/', async (req, res) => {
  try {
    const { name, description, rules, maxPlayers } = req.body;
    const newGame = new Game({ name, description, rules, maxPlayers });
    const game = await newGame.save();
    res.json(game);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
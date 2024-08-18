// client/src/components/MatchMaking.js
import React, { useState, useEffect } from 'react';
import { getGames, createMatch } from '../services/api';

function MatchMaking({ onMatchFound }) {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchGames() {
      try {
        const fetchedGames = await getGames();
        setGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    }
    fetchGames();
  }, []);

  const handleFindMatch = async () => {
    if (selectedGame) {
      try {
        const match = await createMatch({ game: selectedGame });
        setMessage('Match found! Starting game...');
        onMatchFound(match);
      } catch (error) {
        setMessage('Error creating match. Please try again.');
      }
    } else {
      setMessage('Please select a game first.');
    }
  };

  return (
    <div>
      <h2>Find a Match</h2>
      <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
        <option value="">Select a game</option>
        {games.map(game => (
          <option key={game._id} value={game._id}>{game.name}</option>
        ))}
      </select>
      <button onClick={handleFindMatch}>Find Match</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default MatchMaking;
// client/src/components/MatchMaking.js
import React, { useState } from 'react';
import { createMatch } from '../services/api';

function MatchMaking() {
  const [selectedGame, setSelectedGame] = useState('');
  const [message, setMessage] = useState('');

  const handleFindMatch = async () => {
    if (selectedGame) {
      try {
        await createMatch({ game: selectedGame });
        setMessage('Searching for a match...');
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
        {/* Add game options here */}
      </select>
      <button onClick={handleFindMatch}>Find Match</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default MatchMaking;
// client/src/components/GameList.js
import React, { useState, useEffect } from 'react';
import { getGames } from '../services/api';

function GameList() {
  const [games, setGames] = useState([]);

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

  return (
    <div>
      <h2>Available Games</h2>
      <ul>
        {games.map(game => (
          <li key={game._id}>{game.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default GameList;
// client/src/pages/Home.js
import React, { useState } from 'react';
import GameList from '../components/GameList';
import MatchMaking from '../components/MatchMaking';
import TicTacToe from '../components/TicTacToe';

function Home() {
  const [currentGame, setCurrentGame] = useState(null);

  return (
    <div>
      <h1>Welcome to 2players</h1>
      {!currentGame ? (
        <>
          <GameList onSelectGame={setCurrentGame} />
          <MatchMaking onMatchFound={setCurrentGame} />
        </>
      ) : (
        <TicTacToe gameId={currentGame._id} />
      )}
    </div>
  );
}

export default Home;
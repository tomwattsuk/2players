import React, { useState } from 'react';
import GameList from '../components/GameList';
import MatchMaking from '../components/MatchMaking';
import TicTacToe from '../components/TicTacToe';
import ConnectFour from '../components/ConnectFour';

function Home() {
  const [currentGame, setCurrentGame] = useState(null);

  const renderGame = () => {
    if (!currentGame) return <p>Game not found</p>;

    const { name, _id } = currentGame;

    switch (name) {
      case 'Tic-Tac-Toe':
        return <TicTacToe gameId={_id} />;
      case 'Connect Four':
        return <ConnectFour gameId={_id} />;
      default:
        return <p>Game not found</p>;
    }
  };

  return (
    <div>
      <h1>Welcome to 2players</h1>
      {!currentGame ? (
        <>
          <GameList onSelectGame={setCurrentGame} />
          <MatchMaking onMatchFound={setCurrentGame} />
        </>
      ) : (
        renderGame()
      )}
    </div>
  );
}

export default Home;

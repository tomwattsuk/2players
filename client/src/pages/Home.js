import React from 'react';
import GameList from '../components/GameList';
import MatchMaking from '../components/MatchMaking';

function Home() {
  return (
    <div>
      <h1>Welcome to 2players</h1>
      <GameList />
      <MatchMaking />
    </div>
  );
}

export default Home;
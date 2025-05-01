import React from 'react';
import GameArea from './components/GameArea';
import Stats from './components/Stats';
import LoginButton from './components/LoginButton';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './stores/useAuthStore';

const App: React.FC = () => {
  const { onlinePlayers, isConnected, opponentCountry, inGame } = useWebSocket();
  const { user, loading } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-black">
      <header className="w-full bg-white/5 backdrop-blur-lg border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
            2Players.io
          </h1>
          
          <div className="flex items-center gap-6">
            <Stats 
              onlinePlayers={onlinePlayers} 
              opponentCountry={opponentCountry}
              inGame={inGame}
            />
            <LoginButton />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-8">
        {!user && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to 2Players.io</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Sign in to start playing multiplayer games with players from around the world.
            </p>
            <LoginButton />
          </div>
        ) : (
          <GameArea />
        )}
      </main>
    </div>
  );
};

export default App;
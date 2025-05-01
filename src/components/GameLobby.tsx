import React, { useEffect, useState } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { Loader2 } from 'lucide-react';

interface GameLobbyProps {
  onGameStart: (gameId: string) => void;
}

export function GameLobby({ onGameStart }: GameLobbyProps) {
  const { isConnected, createGame, joinGame } = useMultiplayer();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isConnected && !isSearching) {
      setIsSearching(true);
      const gameId = createGame();
      onGameStart(gameId);
    }
  }, [isConnected, isSearching, createGame, onGameStart]);

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Game Lobby</h2>
      <div className="space-y-4">
        {isConnected ? (
          <div className="flex items-center gap-3 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p>Connected to game server</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-yellow-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p>Connecting to game server...</p>
          </div>
        )}
        
        {isSearching && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white bg-opacity-5 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
              <span className="text-gray-300">Finding opponent...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
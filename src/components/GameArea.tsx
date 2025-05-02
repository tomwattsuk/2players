import React, { useState } from 'react';
import { TicTacToe, Checkers, Battleships, Snake } from './games';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { Gamepad2, Loader2, AlertCircle, RefreshCw, Ship, Target, Crown } from 'lucide-react';
import ChatBox from './ChatBox';
import GameEndModal from './GameEndModal';

type GameType = 'battleships' | 'tictactoe' | 'checkers' | 'snake' | null;

interface GameAreaProps {
  onGameEnd?: () => void;
}

export default function GameArea({ onGameEnd = () => {} }: GameAreaProps) {
  const [selectedGame, setSelectedGame] = useState<GameType>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const { 
    isHost, 
    gameId, 
    isConnected,
    isOffline,
    lastError, 
    isMatchmaking, 
    createGame, 
    sendGameState, 
    sendChat,
    sendFriendRequest,
    messages,
    reconnect,
    opponentLeft 
  } = useMultiplayer();

  const handleGameEnd = (winner: string | null) => {
    setGameWinner(winner);
    setShowEndModal(true);
  };

  const handleMainMenu = () => {
    setSelectedGame(null);
    setShowEndModal(false);
    setOpponentDisconnected(false);
    setGameWinner(null);
    onGameEnd();
  };

  const handleRequeue = () => {
    setShowEndModal(false);
    setOpponentDisconnected(false);
    setGameWinner(null);
    if (selectedGame) {
      createGame(selectedGame);
    }
  };

  const handleFriendRequest = () => {
    if (gameId) {
      sendFriendRequest(gameId);
    }
  };

  const handleRetryConnection = () => {
    reconnect();
  };

  const handleGameSelect = (gameType: GameType) => {
    setSelectedGame(gameType);
    if ((isConnected || isOffline) && !isMatchmaking && !gameId && gameType) {
      createGame(gameType);
    }
  };

  const renderError = () => (
    <div className="flex flex-col items-center justify-center p-8" role="alert">
      <div className="w-16 h-16 mb-6 text-red-500">
        <AlertCircle className="w-16 h-16" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Connection Error</h3>
      {lastError && <p className="text-gray-400 mb-4 text-center">{lastError}</p>}
      {!isOffline && (
        <button 
          onClick={handleRetryConnection}
          className="px-6 py-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
          Retry Connection
        </button>
      )}
    </div>
  );

  const renderGame = () => {
    if (!isOffline && !isConnected && lastError) return renderError();
    if (!selectedGame) return renderGameSelection();
    if (!isOffline && (!gameId || isMatchmaking)) return renderSearching();

    const gameProps = {
      onGameEnd: handleGameEnd,
      isHost,
      sendGameState,
      gameId,
      isOffline
    };

    return (
      <>
        {selectedGame === 'battleships' && <Battleships {...gameProps} />}
        {selectedGame === 'tictactoe' && <TicTacToe {...gameProps} />}
        {selectedGame === 'checkers' && <Checkers {...gameProps} />}
        {selectedGame === 'snake' && <Snake {...gameProps} />}
        {!isOffline && <ChatBox onSendMessage={sendChat} messages={messages} />}
        <GameEndModal
          show={showEndModal}
          gameType={selectedGame}
          winner={gameWinner}
          opponentDisconnected={opponentDisconnected}
          onMainMenu={handleMainMenu}
          onRequeue={handleRequeue}
          onFriendRequest={handleFriendRequest}
        />
      </>
    );
  };

  const renderSearching = () => (
    <div className="flex flex-col items-center justify-center p-8" role="status">
      <div className="w-16 h-16 mb-6">
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Finding Opponent...</h3>
      <p className="text-gray-400">This won't take long</p>
      <button 
        onClick={() => setSelectedGame(null)}
        className="mt-6 px-4 py-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition"
      >
        Cancel
      </button>
    </div>
  );

  const renderGameSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="menu">
      <button
        onClick={() => handleGameSelect('battleships')}
        className="p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
        role="menuitem"
        aria-label="Play Battleships"
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Ship size={32} className="text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-white">Battleships</h3>
          <p className="text-gray-400 text-sm mt-2">Strategic naval warfare</p>
        </div>
      </button>

      <button
        onClick={() => handleGameSelect('tictactoe')}
        className="p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
        role="menuitem"
        aria-label="Play Tic Tac Toe"
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-violet-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Target size={32} className="text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-white">Tic Tac Toe</h3>
          <p className="text-gray-400 text-sm mt-2">Classic X's and O's</p>
        </div>
      </button>

      <button
        onClick={() => handleGameSelect('checkers')}
        className="p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
        role="menuitem"
        aria-label="Play Checkers"
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Crown size={32} className="text-white" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-bold text-white">Checkers</h3>
          <p className="text-gray-400 text-sm mt-2">Strategic board game</p>
        </div>
      </button>

      <button
        onClick={() => handleGameSelect('snake')}
        className="p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
        role="menuitem"
        aria-label="Play Snake"
      >
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} />
              <path d="M9 12h6m-6 0l-3-3m3 3l-3 3" strokeWidth={2} />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Snake</h3>
          <p className="text-gray-400 text-sm mt-2">Classic arcade game</p>
        </div>
      </button>
    </div>
  );

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 relative">
      {renderGame()}
    </div>
  );
}
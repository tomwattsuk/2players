import { useState, useEffect } from 'react';
import { TicTacToe, Battleships, Checkers, Snake, SpaceShooter, CoopPong, WordDuel } from './games';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ChatBox from './ChatBox';
import GameEndModal from './GameEndModal';
import VideoChat from './VideoChat';

type GameType = 'tictactoe' | 'checkers' | 'spaceshooter' | 'battleships' | 'snake' | 'cooppong' | 'wordduel' | null;

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
    playerId,
    opponentCountry,
    opponentUsername,
    opponentLeft
  } = useMultiplayer();

  // Show disconnect modal when opponent leaves mid-game
  useEffect(() => {
    if (opponentLeft && selectedGame && !showEndModal) {
      setOpponentDisconnected(true);
      setShowEndModal(true);
    }
  }, [opponentLeft, selectedGame, showEndModal]);

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
        {/* Exit button */}
        {selectedGame && gameId && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleMainMenu}
              aria-label="Exit current game"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-sm font-medium"
            >
              <span aria-hidden="true">✕</span> Exit Game
            </button>
          </div>
        )}
        {selectedGame === 'battleships' && <Battleships {...gameProps} />}
        {selectedGame === 'tictactoe' && <TicTacToe {...gameProps} />}
        {selectedGame === 'checkers' && <Checkers {...gameProps} />}
        {selectedGame === 'snake' && <Snake {...gameProps} />}
        {selectedGame === 'cooppong' && <CoopPong {...gameProps} />}
        {selectedGame === 'wordduel' && <WordDuel {...gameProps} />}
        {selectedGame === 'spaceshooter' && <SpaceShooter {...gameProps} />}
        {!isOffline && (
          <ChatBox
            onSendMessage={sendChat}
            messages={messages}
            opponentUsername={opponentUsername}
            opponentCountry={opponentCountry}
            gameId={gameId}
            playerId={playerId}
          />
        )}
        {!isOffline && gameId && (
          <VideoChat
            gameId={gameId}
            playerId={playerId}
            isHost={isHost}
            opponentUsername={opponentUsername}
            opponentCountry={opponentCountry}
          />
        )}
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
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-live="polite" aria-label="Searching for opponent">
      <div className="w-16 h-16 mb-6">
        <Loader2 className="w-16 h-16 text-pink-500 animate-spin" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Finding Opponent...</h3>
      <p className="text-gray-400">This won't take long</p>
      <button
        onClick={() => setSelectedGame(null)}
        aria-label="Cancel game search"
        className="mt-6 px-4 py-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition"
      >
        Cancel
      </button>
    </div>
  );

  const renderGameSelection = () => {
    const games = [
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      component: TicTacToe,
      description: 'Classic 3x3 grid game',
      icon: '⭕',
      players: '2 Players'
    },
    {
      id: 'checkers',
      name: 'Checkers',
      component: Checkers,
      description: 'Strategic board game',
      icon: '⚫',
      players: '2 Players'
    }
  ];

    return (
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0" role="list" aria-label="Available games">
        {games.map((game) => (
          <li key={game.id} role="listitem">
            <button
              onClick={() => handleGameSelect(game.id as GameType)}
              className="w-full p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
              aria-label={`Play ${game.name}: ${game.description}`}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} aria-hidden="true">
                  {game.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{game.name}</h3>
                <p className="text-gray-400 text-sm mt-2">{game.description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 relative">
      {renderGame()}
    </div>
  );
}
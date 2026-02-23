import { useState } from 'react';
import { TicTacToe, Battleships, Checkers, Snake, SpaceShooter, CoopPong, WordDuel } from './games';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import ChatBox from './ChatBox';
import GameEndModal from './GameEndModal';

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
    reconnect
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
        {selectedGame === 'cooppong' && <CoopPong {...gameProps} />}
        {selectedGame === 'wordduel' && <WordDuel {...gameProps} />}
        {selectedGame === 'spaceshooter' && <SpaceShooter {...gameProps} />}
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

  const renderGameSelection = () => {
    const games = [
    { 
      id: 'wordduel', 
      name: 'Word Duel', 
      component: WordDuel,
      description: 'Guess the hidden word first',
      icon: '📝',
      players: '2 Players'
    },
    { 
      id: 'tictactoe', 
      name: 'Tic Tac Toe', 
      component: TicTacToe,
      description: 'Classic 3x3 grid game',
      icon: '⭕',
      players: '2 Players'
    },
    { 
      id: 'battleships', 
      name: 'Battleships', 
      component: Battleships,
      description: 'Sink your opponent\'s fleet',
      icon: '🚢',
      players: '2 Players'
    },
    { 
      id: 'checkers', 
      name: 'Checkers', 
      component: Checkers,
      description: 'Strategic board game',
      icon: '⚫',
      players: '2 Players'
    },
    { 
      id: 'snake', 
      name: 'Snake Battle', 
      component: Snake,
      description: 'Competitive snake game',
      icon: '🐍',
      players: '2 Players'
    },
    { 
      id: 'spaceshooter', 
      name: 'Space Shooter', 
      component: SpaceShooter,
      description: 'Defend against aliens',
      icon: '🚀',
      players: '1-2 Players'
    },
    { 
      id: 'cooppong', 
      name: 'Coop Pong', 
      component: CoopPong,
      description: 'Work together in Pong',
      icon: '🏓',
      players: '2 Players'
    }
  ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="menu">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameSelect(game.id as GameType)}
            className="p-6 bg-white bg-opacity-5 rounded-xl hover:bg-opacity-10 transition group"
            role="menuitem"
            aria-label={`Play ${game.name}`}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                {game.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{game.name}</h3>
              <p className="text-gray-400 text-sm mt-2">{game.description}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 relative">
      {renderGame()}
    </div>
  );
}
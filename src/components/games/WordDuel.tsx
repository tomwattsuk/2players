
import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '../../hooks/useMultiplayer';
import { motion } from 'framer-motion';
import { Send, Trophy, Clock, User } from 'lucide-react';

interface WordDuelState {
  word: string;
  guesses: Array<{
    word: string;
    feedback: Array<'correct' | 'present' | 'absent'>;
    player: string;
  }>;
  currentPlayer: string;
  winner: string | null;
  gamePhase: 'waiting' | 'playing' | 'finished';
  maxGuesses: number;
  timeLeft: number;
}

const WordDuel: React.FC = () => {
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState<WordDuelState>({
    word: '',
    guesses: [],
    currentPlayer: '',
    winner: null,
    gamePhase: 'waiting',
    maxGuesses: 6,
    timeLeft: 30
  });
  
  const { 
    socket, 
    isConnected, 
    playerId, 
    opponentId, 
    isHost,
    sendGameData,
    gameData 
  } = useMultiplayer('word_duel');

  useEffect(() => {
    if (gameData) {
      setGameState(gameData);
    }
  }, [gameData]);

  useEffect(() => {
    if (isHost && gameState.gamePhase === 'waiting') {
      initializeGame();
    }
  }, [isHost, opponentId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.gamePhase === 'playing' && gameState.currentPlayer === playerId && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            // Time's up, switch to opponent
            const newState = {
              ...prev,
              currentPlayer: prev.currentPlayer === playerId ? opponentId || '' : playerId || '',
              timeLeft: 30
            };
            sendGameData(newState);
            return newState;
          }
          const newState = { ...prev, timeLeft: newTimeLeft };
          sendGameData(newState);
          return newState;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.gamePhase, gameState.currentPlayer, gameState.timeLeft, playerId, opponentId, sendGameData]);

  const initializeGame = () => {
    const words = [
      'GAMES', 'QUEST', 'MAGIC', 'BRAVE', 'STORM', 'PLANT', 'DANCE', 'MUSIC',
      'HEART', 'LIGHT', 'DREAM', 'SPACE', 'OCEAN', 'MOUNT', 'TIGER', 'PEACE'
    ];
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    const newState: WordDuelState = {
      ...gameState,
      word: randomWord,
      currentPlayer: playerId || '',
      gamePhase: 'playing',
      timeLeft: 30
    };
    
    setGameState(newState);
    sendGameData(newState);
  };

  const checkGuess = (guessWord: string, targetWord: string) => {
    const feedback: Array<'correct' | 'present' | 'absent'> = [];
    const targetLetters = targetWord.split('');
    const guessLetters = guessWord.split('');
    
    // First pass: mark correct positions
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        feedback[i] = 'correct';
        targetLetters[i] = '';
        guessLetters[i] = '';
      }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < guessLetters.length; i++) {
      if (guessLetters[i] && targetLetters.includes(guessLetters[i])) {
        feedback[i] = 'present';
        const index = targetLetters.indexOf(guessLetters[i]);
        targetLetters[index] = '';
      } else if (guessLetters[i]) {
        feedback[i] = 'absent';
      }
    }
    
    return feedback;
  };

  const submitGuess = () => {
    if (guess.length !== 5 || gameState.currentPlayer !== playerId) return;
    
    const feedback = checkGuess(guess.toUpperCase(), gameState.word);
    const isCorrect = feedback.every(f => f === 'correct');
    
    const newGuess = {
      word: guess.toUpperCase(),
      feedback,
      player: playerId || ''
    };
    
    const newState = {
      ...gameState,
      guesses: [...gameState.guesses, newGuess],
      winner: isCorrect ? playerId : null,
      gamePhase: isCorrect ? 'finished' as const : gameState.gamePhase,
      currentPlayer: isCorrect ? gameState.currentPlayer : (gameState.currentPlayer === playerId ? opponentId || '' : playerId || ''),
      timeLeft: 30
    };
    
    // Check if max guesses reached
    if (newState.guesses.length >= gameState.maxGuesses && !isCorrect) {
      newState.gamePhase = 'finished';
      newState.winner = 'draw';
    }
    
    setGameState(newState);
    sendGameData(newState);
    setGuess('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  };

  const resetGame = () => {
    if (isHost) {
      initializeGame();
    }
  };

  const getFeedbackColor = (feedback: 'correct' | 'present' | 'absent') => {
    switch (feedback) {
      case 'correct':
        return 'bg-green-500';
      case 'present':
        return 'bg-yellow-500';
      case 'absent':
        return 'bg-gray-500';
      default:
        return 'bg-gray-700';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Connecting...</div>
      </div>
    );
  }

  if (!opponentId) {
    return (
      <div className="text-center p-8">
        <h3 className="text-2xl font-bold text-white mb-4">Word Duel</h3>
        <p className="text-gray-400">Waiting for another player to join...</p>
        <div className="animate-pulse mt-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-800 rounded-xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Word Duel</h2>
        <p className="text-gray-400">Guess the 5-letter word before your opponent!</p>
      </div>

      {/* Game Status */}
      <div className="flex justify-between items-center mb-6 p-4 bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          <span className="text-white">
            {gameState.currentPlayer === playerId ? 'Your Turn' : "Opponent's Turn"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-mono">{gameState.timeLeft}s</span>
        </div>
      </div>

      {/* Guesses Display */}
      <div className="mb-6 space-y-2">
        {gameState.guesses.map((guessData, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-1 justify-center"
          >
            {guessData.word.split('').map((letter, letterIndex) => (
              <div
                key={letterIndex}
                className={`w-12 h-12 flex items-center justify-center text-white font-bold text-lg rounded ${getFeedbackColor(guessData.feedback[letterIndex])}`}
              >
                {letter}
              </div>
            ))}
            <div className="ml-2 flex items-center">
              <span className="text-xs text-gray-400">
                {guessData.player === playerId ? 'You' : 'Opponent'}
              </span>
            </div>
          </motion.div>
        ))}
        
        {/* Empty rows */}
        {Array.from({ length: gameState.maxGuesses - gameState.guesses.length }).map((_, index) => (
          <div key={`empty-${index}`} className="flex gap-1 justify-center">
            {Array.from({ length: 5 }).map((_, letterIndex) => (
              <div
                key={letterIndex}
                className="w-12 h-12 border-2 border-gray-600 rounded"
              />
            ))}
          </div>
        ))}
      </div>

      {/* Input Area */}
      {gameState.gamePhase === 'playing' && gameState.currentPlayer === playerId && (
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value.slice(0, 5).toUpperCase())}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-lg font-mono tracking-widest"
              placeholder="GUESS"
              maxLength={5}
            />
            <button
              onClick={submitGuess}
              disabled={guess.length !== 5}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Game End */}
      {gameState.gamePhase === 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6 bg-slate-700 rounded-lg"
        >
          <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {gameState.winner === playerId ? 'You Won!' : 
             gameState.winner === 'draw' ? "It's a Draw!" : 'You Lost!'}
          </h3>
          <p className="text-gray-400 mb-4">
            The word was: <span className="text-white font-bold">{gameState.word}</span>
          </p>
          {isHost && (
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
            >
              Play Again
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default WordDuel;

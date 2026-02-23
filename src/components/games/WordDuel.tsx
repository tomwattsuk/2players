import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Trophy, Clock, User } from 'lucide-react';

interface WordDuelProps {
  onGameEnd: (winner: string | null) => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId: string;
  isOffline?: boolean;
}

interface WordDuelState {
  word: string;
  guesses: Array<{
    word: string;
    feedback: Array<'correct' | 'present' | 'absent'>;
    player: 'host' | 'guest';
  }>;
  currentPlayer: 'host' | 'guest';
  winner: 'host' | 'guest' | 'draw' | null;
  gamePhase: 'waiting' | 'playing' | 'finished';
  maxGuesses: number;
  timeLeft: number;
}

const WORDS = [
  'GAMES', 'QUEST', 'MAGIC', 'BRAVE', 'STORM', 'PLANT', 'DANCE', 'MUSIC',
  'HEART', 'LIGHT', 'DREAM', 'SPACE', 'OCEAN', 'MOUNT', 'TIGER', 'PEACE'
];

const WordDuel = ({ onGameEnd, isHost, sendGameState }: WordDuelProps) => {
  const [guess, setGuess] = useState('');
  const [gameState, setGameState] = useState<WordDuelState>({
    word: '',
    guesses: [],
    currentPlayer: 'host',
    winner: null,
    gamePhase: 'waiting',
    maxGuesses: 6,
    timeLeft: 30
  });

  // Initialize game if host
  useEffect(() => {
    if (isHost && gameState.gamePhase === 'waiting') {
      const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
      const newState: WordDuelState = {
        ...gameState,
        word: randomWord,
        currentPlayer: 'host',
        gamePhase: 'playing',
        timeLeft: 30
      };
      setGameState(newState);
      sendGameState({ type: 'wordduel', data: newState });
    }
  }, [isHost]);

  // Listen for game state updates
  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'wordduel') {
        setGameState(state.data);
        if (state.data.winner && state.data.winner !== 'draw') {
          setTimeout(() => onGameEnd(state.data.winner), 1500);
        } else if (state.data.winner === 'draw') {
          setTimeout(() => onGameEnd(null), 1500);
        }
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => {
      window.removeEventListener('game_state', handleGameState as EventListener);
    };
  }, [onGameEnd]);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const myRole = isHost ? 'host' : 'guest';

    if (gameState.gamePhase === 'playing' && gameState.currentPlayer === myRole && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          if (newTimeLeft <= 0) {
            const newState: WordDuelState = {
              ...prev,
              currentPlayer: prev.currentPlayer === 'host' ? 'guest' : 'host',
              timeLeft: 30
            };
            sendGameState({ type: 'wordduel', data: newState });
            return newState;
          }
          return { ...prev, timeLeft: newTimeLeft };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.gamePhase, gameState.currentPlayer, isHost, sendGameState]);

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
    const myRole = isHost ? 'host' : 'guest';
    if (guess.length !== 5 || gameState.currentPlayer !== myRole) return;

    const feedback = checkGuess(guess.toUpperCase(), gameState.word);
    const isCorrect = feedback.every(f => f === 'correct');

    const newGuess = {
      word: guess.toUpperCase(),
      feedback,
      player: myRole as 'host' | 'guest'
    };

    const newState: WordDuelState = {
      ...gameState,
      guesses: [...gameState.guesses, newGuess],
      winner: isCorrect ? myRole : null,
      gamePhase: isCorrect ? 'finished' : gameState.gamePhase,
      currentPlayer: isCorrect ? gameState.currentPlayer : (gameState.currentPlayer === 'host' ? 'guest' : 'host'),
      timeLeft: 30
    };

    // Check if max guesses reached
    if (newState.guesses.length >= gameState.maxGuesses && !isCorrect) {
      newState.gamePhase = 'finished';
      newState.winner = 'draw';
    }

    setGameState(newState);
    sendGameState({ type: 'wordduel', data: newState });
    setGuess('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitGuess();
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

  const myRole = isHost ? 'host' : 'guest';
  const isMyTurn = gameState.currentPlayer === myRole;

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
            {isMyTurn ? 'Your Turn' : "Opponent's Turn"}
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
                {guessData.player === myRole ? 'You' : 'Opponent'}
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
      {gameState.gamePhase === 'playing' && isMyTurn && (
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
            {gameState.winner === myRole ? 'You Won!' :
             gameState.winner === 'draw' ? "It's a Draw!" : 'You Lost!'}
          </h3>
          <p className="text-gray-400 mb-4">
            The word was: <span className="text-white font-bold">{gameState.word}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default WordDuel;

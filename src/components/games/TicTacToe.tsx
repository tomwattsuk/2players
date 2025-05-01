import React, { useState, useEffect } from 'react';
import { X, Circle } from 'lucide-react';

interface TicTacToeProps {
  onGameEnd: () => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId: string;
  isOffline?: boolean;
}

const TicTacToe = ({ onGameEnd, isHost, sendGameState, gameId, isOffline = false }: TicTacToeProps) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameOver, setGameOver] = useState(false);

  const isMyTurn = (isHost && isXNext) || (!isHost && !isXNext);

  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'tictactoe') {
        setBoard(state.board);
        setIsXNext(state.isXNext);
      }
    };

    // Listen for game state updates
    window.addEventListener('game_state', handleGameState as EventListener);
    return () => {
      window.removeEventListener('game_state', handleGameState as EventListener);
    };
  }, []);

  const handleClick = (index: number) => {
    if (!isMyTurn || board[index] || calculateWinner(board) || gameOver) return;
    
    const newBoard = [...board];
    newBoard[index] = isHost ? 'X' : 'O';
    
    setBoard(newBoard);
    setIsXNext(!isXNext);
    
    sendGameState({
      type: 'tictactoe',
      board: newBoard,
      isXNext: !isXNext
    });

    const winner = calculateWinner(newBoard);
    if (winner || newBoard.every(square => square)) {
      setGameOver(true);
      setTimeout(onGameEnd, 1500);
    }
  };

  const renderSquare = (index: number) => {
    const value = board[index];
    return (
      <button
        key={index}
        className={`w-24 h-24 bg-white bg-opacity-10 rounded-lg flex items-center justify-center transition
          ${isMyTurn && !value ? 'hover:bg-opacity-20' : ''}
          ${value === 'X' ? 'text-pink-500' : 'text-violet-500'}
          ${!isMyTurn || gameOver ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => handleClick(index)}
        disabled={!isMyTurn || gameOver}
      >
        {value === 'X' && <X size={40} />}
        {value === 'O' && <Circle size={40} />}
      </button>
    );
  };

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(square => square);
  
  const status = winner
    ? `Winner: ${winner === 'X' ? 'Player 1' : 'Player 2'}`
    : isDraw
    ? "It's a draw!"
    : isMyTurn
    ? "Your turn"
    : "Opponent's turn";

  return (
    <div className="flex flex-col items-center">
      <h3 className={`text-xl font-bold mb-4 ${winner ? 'text-green-500' : isDraw ? 'text-yellow-500' : 'text-white'}`}>
        {status}
      </h3>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Array(9).fill(null).map((_, i) => renderSquare(i))}
      </div>
      <div className="mt-4 text-sm text-gray-400">
        {isHost ? "You are Player 1 (X)" : "You are Player 2 (O)"}
      </div>
    </div>
  );
};

function calculateWinner(squares: Array<string | null>) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default TicTacToe;
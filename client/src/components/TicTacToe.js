// client/src/components/TicTacToe.js
import React, { useState, useEffect } from 'react';
import { joinGame, makeMove, onOpponentMove } from '../services/socket';

function TicTacToe({ gameId }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(true);

  useEffect(() => {
    joinGame(gameId);

    onOpponentMove((move) => {
      const newBoard = [...board];
      newBoard[move] = xIsNext ? 'O' : 'X';
      setBoard(newBoard);
      setXIsNext(!xIsNext);
      setIsMyTurn(true);
    });

    return () => {
      // Clean up socket listeners
    };
  }, [gameId, board, xIsNext]);

  const handleClick = (i) => {
    if (!isMyTurn || calculateWinner(board) || board[i]) return;

    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    setIsMyTurn(false);

    makeMove(gameId, i);
  };

  const renderSquare = (i) => {
    return (
      <button className="square" onClick={() => handleClick(i)}>
        {board[i]}
      </button>
    );
  };

  const winner = calculateWinner(board);
  let status;
  if (winner) {
    status = `Winner: ${winner}`;
  } else if (board.every(Boolean)) {
    status = "It's a draw!";
  } else {
    status = `Next player: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div>
      <div className="status">{status}</div>
      <div className="board-row">
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div className="board-row">
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div className="board-row">
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

export default TicTacToe;
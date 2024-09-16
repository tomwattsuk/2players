import React, { useState, useEffect, useCallback } from 'react';
import { makeMove, onOpponentMove } from '../services/socket';

const ROWS = 6;
const COLS = 7;

function ConnectFour({ gameId }) {
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [winner, setWinner] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(true);

  const countDirection = useCallback((board, row, col, dx, dy) => {
    let count = 0;
    let x = row + dx;
    let y = col + dy;
    while (x >= 0 && x < ROWS && y >= 0 && y < COLS && board[x][y] === board[row][col]) {
      count++;
      x += dx;
      y += dy;
    }
    return count;
  }, []);

  const checkWinner = useCallback((board, row, col) => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    for (let [dx, dy] of directions) {
      let count = 1;
      count += countDirection(board, row, col, dx, dy);
      count += countDirection(board, row, col, -dx, -dy);
      if (count >= 4) {
        setWinner(board[row][col]);
        return;
      }
    }
  }, [countDirection]);

  const findLowestEmptyRow = useCallback((col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!board[row][col]) return row;
    }
    return -1;
  }, [board]);

  const handleClick = useCallback((col) => {
    if (!isMyTurn || winner) return;
    const row = findLowestEmptyRow(col);
    if (row === -1) return;
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
    setIsMyTurn(false);
    makeMove(gameId, [row, col]);
    checkWinner(newBoard, row, col);
  }, [isMyTurn, winner, board, currentPlayer, gameId, checkWinner, findLowestEmptyRow]);

  useEffect(() => {
    onOpponentMove((move) => {
      const [row, col] = move;
      const newBoard = board.map(row => [...row]);
      newBoard[row][col] = currentPlayer === 'red' ? 'yellow' : 'red';
      setBoard(newBoard);
      setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
      setIsMyTurn(true);
      checkWinner(newBoard, row, col);
    });
  }, [board, currentPlayer, checkWinner]);

  return (
    <div>
      <h2>Connect Four</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex' }}>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                onClick={() => handleClick(colIndex)}
                style={{
                  width: 50,
                  height: 50,
                  backgroundColor: 'blue',
                  margin: 2,
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {cell && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: cell,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {winner && <p>{winner} wins!</p>}
      {!winner && <p>Current player: {currentPlayer}</p>}
    </div>
  );
}

export default ConnectFour;
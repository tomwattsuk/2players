import React, { useState, useEffect } from 'react';
import { Anchor, Target, Crosshair } from 'lucide-react';

interface BattleshipsProps {
  onGameEnd: (winner: string | null) => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId: string;
  isOffline?: boolean;
}

type Cell = 'empty' | 'ship' | 'hit' | 'miss';
type Board = Cell[][];

const BOARD_SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2]; // Ship lengths

const Battleships: React.FC<BattleshipsProps> = ({
  onGameEnd,
  isHost,
  sendGameState,
  isOffline = false
}) => {
  const [myBoard, setMyBoard] = useState<Board>(initializeBoard());
  const [opponentBoard, setOpponentBoard] = useState<Board>(initializeBoard());
  const [placingShips, setPlacingShips] = useState(true);
  const [currentShip, setCurrentShip] = useState(0);
  const [isVertical, setIsVertical] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(isHost);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'battleships') {
        if (state.action === 'shot') {
          handleIncomingShot(state.position);
        } else if (state.action === 'result') {
          handleShotResult(state.position, state.hit);
        }
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, []);

  function initializeBoard(): Board {
    return Array(BOARD_SIZE).fill(null).map(() => 
      Array(BOARD_SIZE).fill('empty')
    );
  }

  function canPlaceShip(board: Board, row: number, col: number, length: number, vertical: boolean): boolean {
    if (vertical) {
      if (row + length > BOARD_SIZE) return false;
      for (let i = 0; i < length; i++) {
        if (board[row + i][col] !== 'empty') return false;
      }
    } else {
      if (col + length > BOARD_SIZE) return false;
      for (let i = 0; i < length; i++) {
        if (board[row][col + i] !== 'empty') return false;
      }
    }
    return true;
  }

  function placeShip(row: number, col: number) {
    if (currentShip >= SHIPS.length) return;
    
    const shipLength = SHIPS[currentShip];
    if (!canPlaceShip(myBoard, row, col, shipLength, isVertical)) return;

    const newBoard = myBoard.map(row => [...row]);
    if (isVertical) {
      for (let i = 0; i < shipLength; i++) {
        newBoard[row + i][col] = 'ship';
      }
    } else {
      for (let i = 0; i < shipLength; i++) {
        newBoard[row][col + i] = 'ship';
      }
    }

    setMyBoard(newBoard);
    setCurrentShip(currentShip + 1);
    
    if (currentShip === SHIPS.length - 1) {
      setPlacingShips(false);
      sendGameState({
        type: 'battleships',
        action: 'ready'
      });
    }
  }

  function handleCellClick(row: number, col: number, isOpponent: boolean) {
    if (gameOver) return;
    
    if (placingShips && !isOpponent) {
      placeShip(row, col);
    } else if (!placingShips && isOpponent && isMyTurn) {
      if (opponentBoard[row][col] === 'hit' || opponentBoard[row][col] === 'miss') return;
      
      sendGameState({
        type: 'battleships',
        action: 'shot',
        position: { row, col }
      });
      setIsMyTurn(false);
    }
  }

  function handleIncomingShot(position: { row: number; col: number }) {
    const hit = myBoard[position.row][position.col] === 'ship';
    const newBoard = myBoard.map(row => [...row]);
    newBoard[position.row][position.col] = hit ? 'hit' : 'miss';
    setMyBoard(newBoard);

    sendGameState({
      type: 'battleships',
      action: 'result',
      position,
      hit
    });

    if (checkGameOver(newBoard)) {
      setGameOver(true);
      onGameEnd('opponent');
    }
  }

  function handleShotResult(position: { row: number; col: number }, hit: boolean) {
    const newBoard = opponentBoard.map(row => [...row]);
    newBoard[position.row][position.col] = hit ? 'hit' : 'miss';
    setOpponentBoard(newBoard);
    setIsMyTurn(true);

    if (checkGameOver(newBoard)) {
      setGameOver(true);
      onGameEnd('you');
    }
  }

  function checkGameOver(board: Board): boolean {
    return !board.some(row => row.some(cell => cell === 'ship'));
  }

  function renderBoard(board: Board, isOpponent: boolean) {
    return (
      <div className="grid grid-cols-10 gap-1 bg-slate-800 p-4 rounded-lg">
        {board.map((row, rowIndex) => (
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex, isOpponent)}
              disabled={placingShips ? isOpponent : !isMyTurn || gameOver}
              className={`
                w-10 h-10 rounded-md flex items-center justify-center transition
                ${getCellStyle(cell, isOpponent)}
                ${isOpponent && !gameOver ? 'hover:bg-opacity-50' : ''}
              `}
            >
              {getCellContent(cell, isOpponent)}
            </button>
          ))
        ))}
      </div>
    );
  }

  function getCellStyle(cell: Cell, isOpponent: boolean): string {
    if (cell === 'empty') return 'bg-slate-700';
    if (cell === 'ship' && !isOpponent) return 'bg-blue-500';
    if (cell === 'hit') return 'bg-red-500';
    if (cell === 'miss') return 'bg-slate-600';
    return 'bg-slate-700';
  }

  function getCellContent(cell: Cell, isOpponent: boolean) {
    if (cell === 'ship' && !isOpponent) return <Anchor className="w-6 h-6 text-white" />;
    if (cell === 'hit') return <Target className="w-6 h-6 text-white" />;
    if (cell === 'miss') return <Crosshair className="w-6 h-6 text-gray-400" />;
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {gameOver ? 'Game Over!' : placingShips ? 'Place Your Ships' : isMyTurn ? 'Your Turn' : "Opponent's Turn"}
        </h2>
        {placingShips && currentShip < SHIPS.length && (
          <div className="flex flex-col items-center gap-2">
            <p>Placing ship of length {SHIPS[currentShip]}</p>
            <button
              onClick={() => setIsVertical(!isVertical)}
              className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition"
            >
              {isVertical ? 'Vertical' : 'Horizontal'}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-center">Your Board</h3>
          {renderBoard(myBoard, false)}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4 text-center">Opponent's Board</h3>
          {renderBoard(opponentBoard, true)}
        </div>
      </div>
    </div>
  );
};

export default Battleships;
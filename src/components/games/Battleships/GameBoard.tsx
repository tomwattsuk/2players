import React from 'react';
import Grid from './Grid';
import type { Board, Ship } from './types';

interface GameBoardProps {
  title: string;
  board: Board;
  showShips: boolean;
  onCellClick: (x: number, y: number) => void;
  selectedShip: Ship | null;
  isVertical: boolean;
  onDrop?: (x: number, y: number) => void;
  placedShips?: Ship[];
  onShipMove?: (ship: Ship, x: number, y: number) => void;
  isLocked?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  title,
  board,
  showShips,
  onCellClick,
  selectedShip,
  isVertical,
  onDrop,
  placedShips,
  onShipMove,
  isLocked
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border border-white/5">
      <h3 className="text-center mb-4 font-semibold text-lg text-white/90">{title}</h3>
      <Grid
        board={board}
        showShips={showShips}
        onCellClick={onCellClick}
        selectedShip={selectedShip}
        isVertical={isVertical}
        onDrop={onDrop}
        placedShips={placedShips}
        onShipMove={onShipMove}
        isLocked={isLocked}
      />
    </div>
  );
};

export default GameBoard;
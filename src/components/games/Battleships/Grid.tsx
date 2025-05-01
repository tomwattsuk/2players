import React from 'react';
import { Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CellEffect, ShipDamageEffect } from './Effects';
import type { Board, Ship } from './types';
import { canPlaceShipAt } from './gameLogic';

interface GridProps {
  board: Board;
  onCellClick: (x: number, y: number) => void;
  selectedShip: Ship | null;
  isVertical: boolean;
  onDrop?: (x: number, y: number) => void;
  placedShips?: Ship[];
  onShipMove?: (ship: Ship, x: number, y: number) => void;
  isLocked?: boolean;
}

const Grid: React.FC<GridProps> = ({
  board,
  onCellClick,
  selectedShip,
  isVertical,
  onDrop,
  placedShips = [],
  onShipMove,
  isLocked = false
}) => {
  const [hoverCell, setHoverCell] = React.useState<{ x: number; y: number } | null>(null);
  const [lastHit, setLastHit] = React.useState<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    if (lastHit) {
      const timer = setTimeout(() => setLastHit(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastHit]);

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setHoverCell({ x, y });
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    setHoverCell(null);
    onDrop?.(x, y);
  };

  const handleDragLeave = () => {
    setHoverCell(null);
  };

  const isValidPlacement = (x: number, y: number) => {
    if (!selectedShip || !hoverCell) return true;
    return canPlaceShipAt(board, x, y, selectedShip.size, isVertical);
  };

  const getPreviewCells = (x: number, y: number) => {
    if (!selectedShip || !hoverCell || hoverCell.x !== x || hoverCell.y !== y) {
      return new Set<string>();
    }

    const cells = new Set<string>();
    const size = selectedShip.size;

    for (let i = 0; i < size; i++) {
      const previewX = isVertical ? x : x + i;
      const previewY = isVertical ? y + i : y;
      
      if (previewX < 10 && previewY < 10) {
        cells.add(`${previewX}-${previewY}`);
      }
    }
    return cells;
  };

  const getShipAt = (x: number, y: number) => {
    return placedShips.find(ship => 
      ship.coordinates.some(coord => coord.x === x && coord.y === y)
    );
  };

  return (
    <div className="relative">
      {/* Column labels */}
      <div className="flex pl-8 mb-1">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="w-10 text-center text-gray-300 font-medium">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
      
      <div className="flex">
        {/* Row labels */}
        <div className="flex flex-col mr-1">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-10 w-7 flex items-center justify-end pr-2 text-gray-300 font-medium">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-10 gap-0.5 bg-slate-800 p-2 rounded-lg">
          {board.map((row, y) => (
            row.map((cell, x) => {
              const previewCells = getPreviewCells(x, y);
              const isPreview = previewCells.has(`${x}-${y}`);
              const isValidPos = isValidPlacement(x, y);
              const ship = getShipAt(x, y);
              const isDraggable = ship && !isLocked;

              return (
                <motion.div
                  key={`${x}-${y}`}
                  onClick={() => onCellClick(x, y)}
                  onDragOver={(e) => handleDragOver(e, x, y)}
                  onDrop={(e) => handleDrop(e, x, y)}
                  onDragLeave={handleDragLeave}
                  draggable={isDraggable}
                  onDragStart={(e) => {
                    if (ship && !isLocked) {
                      e.dataTransfer.setData('text/plain', ship.name);
                      onShipMove?.(ship, x, y);
                    }
                  }}
                  className={`
                    relative w-10 h-10 rounded-sm flex items-center justify-center transition-all duration-200
                    border border-slate-700
                    ${cell.isHit && cell.hasShip ? 'bg-red-500 border-red-600' : ''}
                    ${cell.isHit && !cell.hasShip ? 'bg-slate-600 border-slate-500' : ''}
                    ${!cell.isHit && cell.hasShip ? 'bg-blue-500 border-blue-600' : ''}
                    ${!cell.isHit && !cell.hasShip ? 'bg-slate-700 border-slate-600' : ''}
                    ${isPreview ? (isValidPos ? 'bg-green-500/50' : 'bg-red-500/50') : ''}
                    ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${!cell.isHit ? 'hover:brightness-110 hover:border-white/30' : ''}
                  `}
                  role="button"
                  aria-label={`Grid position ${String.fromCharCode(65 + x)}${y + 1}`}
                  aria-pressed={cell.isHit}
                  whileHover={{ scale: cell.isHit ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence>
                    {cell.isHit && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Target 
                          className={`w-5 h-5 ${cell.hasShip ? 'text-white' : 'text-slate-300'}`}
                          aria-label={cell.hasShip ? 'Hit' : 'Miss'}
                        />
                      </motion.div>
                    )}

                    {cell.isHit && (
                      <CellEffect type={cell.hasShip ? 'explosion' : 'splash'} />
                    )}

                    {isPreview && isValidPos && (
                      <CellEffect type="preview" />
                    )}

                    {ship && !cell.isHit && (
                      <ShipDamageEffect 
                        damage={ship.coordinates.filter(c => 
                          board[c.y][c.x].isHit
                        ).length / ship.size} 
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
};

export default Grid;
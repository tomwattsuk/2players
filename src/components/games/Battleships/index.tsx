import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import Grid from './Grid';
import ShipList from './ShipList';
import GameStatus from './GameStatus';
import { initializeBoard, SHIPS, canPlaceShipAt } from './gameLogic';
import type { Board, Ship, GameState } from './types';

interface BattleshipsProps {
  onGameEnd: (winner: string | null) => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId: string;
  isOffline?: boolean;
}

const Battleships: React.FC<BattleshipsProps> = ({ 
  onGameEnd, 
  isHost, 
  sendGameState,
  isOffline = false 
}) => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [placedShips, setPlacedShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    const handleGameState = (e: CustomEvent<GameState>) => {
      const state = e.detail;
      if (state.type !== 'battleships') return;

      switch (state.action) {
        case 'ready':
          setOpponentReady(true);
          if (isLocked) {
            setGameStarted(true);
          }
          break;
        case 'shot':
          // Handle incoming shot
          break;
        case 'hit':
          // Handle hit result
          break;
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, [isLocked]);

  // When either player locks in, check if we can start the game
  useEffect(() => {
    if (isLocked && opponentReady) {
      setGameStarted(true);
    }
  }, [isLocked, opponentReady]);

  const handleSelectShip = (ship: typeof SHIPS[number]) => {
    if (isLocked) return;
    setSelectedShip({
      ...ship,
      coordinates: [],
      isVertical
    });
  };

  const handleRotateShip = () => {
    if (isLocked) return;
    setIsVertical(!isVertical);
    if (selectedShip) {
      setSelectedShip({
        ...selectedShip,
        isVertical: !isVertical
      });
    }
  };

  const handleLockIn = () => {
    if (placedShips.length !== SHIPS.length) return;
    setIsLocked(true);
    sendGameState({
      type: 'battleships',
      action: 'ready',
      board
    });
  };

  const removeShip = (shipName: string) => {
    const ship = placedShips.find(s => s.name === shipName);
    if (!ship) return;

    const newBoard = [...board];
    ship.coordinates.forEach(({ x, y }) => {
      newBoard[y][x].hasShip = false;
    });

    setBoard(newBoard);
    setPlacedShips(placedShips.filter(s => s.name !== shipName));
    setSelectedShip({
      ...ship,
      coordinates: [],
      isVertical: ship.isVertical
    });
  };

  const placeShip = (x: number, y: number) => {
    if (!selectedShip || isLocked) return;
    
    if (!canPlaceShipAt(board, x, y, selectedShip.size, isVertical)) return;

    const newBoard = [...board];
    const coordinates = [];

    for (let i = 0; i < selectedShip.size; i++) {
      const shipX = isVertical ? x : x + i;
      const shipY = isVertical ? y + i : y;
      newBoard[shipY][shipX].hasShip = true;
      coordinates.push({ x: shipX, y: shipY });
    }

    const newShip = {
      ...selectedShip,
      coordinates,
      isVertical
    };

    setBoard(newBoard);
    setPlacedShips([...placedShips.filter(s => s.name !== selectedShip.name), newShip]);
    setSelectedShip(null);
  };

  const handleShipMove = (ship: Ship) => {
    if (isLocked) return;
    removeShip(ship.name);
  };

  const handleCellClick = (x: number, y: number) => {
    if (!gameStarted) {
      placeShip(x, y);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <GameStatus
        gameOver={!!winner}
        winner={winner}
        isPlacing={!gameStarted}
        isLocked={isLocked}
        isMyTurn={isHost}
        opponentReady={opponentReady}
      />

      <div className="flex gap-8 mt-6">
        <div className="w-80">
          <ShipList
            placedShips={placedShips}
            selectedShip={selectedShip}
            onSelectShip={handleSelectShip}
            onRotateShip={handleRotateShip}
            isVertical={isVertical}
            isLocked={isLocked}
          />

          <button
            onClick={handleLockIn}
            disabled={placedShips.length !== SHIPS.length || isLocked}
            className={`
              w-full mt-6 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2
              ${isLocked 
                ? 'bg-green-600 cursor-not-allowed' 
                : placedShips.length === SHIPS.length
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Lock className="w-5 h-5" />
            {isLocked ? 'Ships Locked' : 'Lock In Ships'}
          </button>

          {isLocked && !gameStarted && (
            <div className="mt-4 text-center text-sm text-gray-400">
              {opponentReady 
                ? 'Starting game...'
                : 'Waiting for opponent to place their ships...'}
            </div>
          )}
        </div>

        <div>
          <Grid
            board={board}
            onCellClick={handleCellClick}
            selectedShip={selectedShip}
            isVertical={isVertical}
            onDrop={placeShip}
            placedShips={placedShips}
            onShipMove={handleShipMove}
            isLocked={isLocked}
          />
        </div>
      </div>
    </div>
  );
};

export default Battleships;
import { useState, useEffect, useRef } from 'react';
import { Lock, Crosshair, Shield } from 'lucide-react';
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
  sendGameState
}) => {
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => { onGameEndRef.current = onGameEnd; }, [onGameEnd]);
  // Placement phase
  const [myBoard, setMyBoard] = useState<Board>(initializeBoard());
  const [placedShips, setPlacedShips] = useState<Ship[]>([]);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Battle phase
  const [attackBoard, setAttackBoard] = useState<Board>(initializeBoard());
  const [isMyTurn, setIsMyTurn] = useState(isHost); // host fires first
  const [winner, setWinner] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ hit: boolean } | null>(null);

  useEffect(() => {
    const handleGameState = (e: CustomEvent<GameState>) => {
      const state = e.detail;
      if (state.type !== 'battleships') return;

      switch (state.action) {
        case 'ready':
          setOpponentReady(true);
          if (isLocked) setGameStarted(true);
          break;

        case 'shot': {
          if (!state.coordinate) break;
          const { x, y } = state.coordinate;

          // Mark my board as hit
          setMyBoard(prev => {
            const next = prev.map(row => row.map(cell => ({ ...cell })));
            next[y][x].isHit = true;

            const hit = prev[y][x].hasShip;

            // Count remaining un-hit ship cells
            const remaining = next.flat().filter(c => c.hasShip && !c.isHit).length;
            const allSunk = remaining === 0;

            // Send result back to attacker
            sendGameState({
              type: 'battleships',
              action: 'result',
              coordinate: { x, y },
              hit,
              allSunk,
            });

            if (allSunk) {
              setWinner(isHost ? 'guest' : 'host');
              onGameEndRef.current(isHost ? 'guest' : 'host');
            }

            return next;
          });

          // It becomes my turn now (attacker's turn ends after shot is received)
          setIsMyTurn(true);
          break;
        }

        case 'result': {
          if (!state.coordinate) break;
          const { x, y } = state.coordinate;
          const hit = state.hit ?? false;

          setAttackBoard(prev => {
            const next = prev.map(row => row.map(cell => ({ ...cell })));
            next[y][x].isHit = true;
            next[y][x].hasShip = hit;
            return next;
          });

          setLastResult({ hit });

          if (state.allSunk) {
            const w = isHost ? 'host' : 'guest';
            setWinner(w);
            onGameEndRef.current(w);
          }

          // Turn passes to opponent after we see result
          setIsMyTurn(false);
          break;
        }
      }
    };

    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, [isLocked, isHost, sendGameState]);

  // Start game when both players are ready
  useEffect(() => {
    if (isLocked && opponentReady) setGameStarted(true);
  }, [isLocked, opponentReady]);

  // ---- Placement phase handlers ----

  const handleSelectShip = (ship: typeof SHIPS[number]) => {
    if (isLocked) return;
    setSelectedShip({ ...ship, coordinates: [], isVertical });
  };

  const handleRotateShip = () => {
    if (isLocked) return;
    setIsVertical(v => !v);
    if (selectedShip) {
      setSelectedShip(s => s ? { ...s, isVertical: !s.isVertical } : s);
    }
  };

  const handleLockIn = () => {
    if (placedShips.length !== SHIPS.length) return;
    setIsLocked(true);
    sendGameState({ type: 'battleships', action: 'ready', board: myBoard });
  };

  const removeShip = (shipName: string) => {
    const ship = placedShips.find(s => s.name === shipName);
    if (!ship) return;
    const newBoard = myBoard.map(row => row.map(cell => ({ ...cell })));
    ship.coordinates.forEach(({ x, y }) => { newBoard[y][x].hasShip = false; });
    setMyBoard(newBoard);
    setPlacedShips(placedShips.filter(s => s.name !== shipName));
    setSelectedShip({ ...ship, coordinates: [], isVertical: ship.isVertical });
  };

  const placeShip = (x: number, y: number) => {
    if (!selectedShip || isLocked) return;
    if (!canPlaceShipAt(myBoard, x, y, selectedShip.size, isVertical)) return;

    const newBoard = myBoard.map(row => row.map(cell => ({ ...cell })));
    const coordinates = [];

    for (let i = 0; i < selectedShip.size; i++) {
      const sx = isVertical ? x : x + i;
      const sy = isVertical ? y + i : y;
      newBoard[sy][sx].hasShip = true;
      coordinates.push({ x: sx, y: sy });
    }

    setMyBoard(newBoard);
    setPlacedShips([...placedShips.filter(s => s.name !== selectedShip.name), { ...selectedShip, coordinates, isVertical }]);
    setSelectedShip(null);
  };

  const handleCellClick = (x: number, y: number) => {
    if (!gameStarted) placeShip(x, y);
  };

  // ---- Battle phase handler ----

  const handleAttackCell = (x: number, y: number) => {
    if (!isMyTurn || winner || attackBoard[y][x].isHit) return;
    setIsMyTurn(false); // optimistic — wait for result to confirm
    sendGameState({
      type: 'battleships',
      action: 'shot',
      coordinate: { x, y },
    });
  };

  // ---- Render ----

  if (gameStarted) {
    return (
      <div className="flex flex-col items-center">
        <GameStatus
          gameOver={!!winner}
          winner={winner}
          isPlacing={false}
          isLocked={isLocked}
          isMyTurn={isMyTurn}
          opponentReady={opponentReady}
        />

        {lastResult && (
          <div className={`text-sm font-semibold mb-2 ${lastResult.hit ? 'text-red-400' : 'text-blue-300'}`}>
            {lastResult.hit ? '💥 Hit!' : '💧 Miss!'}
          </div>
        )}

        <div className="flex gap-10 mt-4 flex-wrap justify-center">
          {/* My fleet */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-blue-300 font-semibold">
              <Shield className="w-4 h-4" /> My Fleet
            </div>
            <Grid
              board={myBoard}
              onCellClick={() => {}}
              selectedShip={null}
              isVertical={false}
              isLocked={true}
              showShips={true}
              placedShips={placedShips}
            />
          </div>

          {/* Attack board */}
          <div className="flex flex-col items-center gap-2">
            <div className={`flex items-center gap-2 font-semibold ${isMyTurn ? 'text-green-400' : 'text-gray-400'}`}>
              <Crosshair className="w-4 h-4" />
              {isMyTurn ? 'Your Turn — Click to Fire!' : "Enemy Waters (opponent's turn)"}
            </div>
            <Grid
              board={attackBoard}
              onCellClick={handleAttackCell}
              selectedShip={null}
              isVertical={false}
              isLocked={!isMyTurn || !!winner}
              showShips={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Placement phase
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
              {opponentReady ? 'Starting game...' : 'Waiting for opponent to place their ships...'}
            </div>
          )}
        </div>

        <div>
          <Grid
            board={myBoard}
            onCellClick={handleCellClick}
            selectedShip={selectedShip}
            isVertical={isVertical}
            onDrop={placeShip}
            placedShips={placedShips}
            onShipMove={(ship) => removeShip(ship.name)}
            isLocked={isLocked}
          />
        </div>
      </div>
    </div>
  );
};

export default Battleships;

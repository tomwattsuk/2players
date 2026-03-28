import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

interface SnakeProps {
  onGameEnd: (winner: string | null) => void;
  sendGameState: (state: any) => void;
  isHost: boolean;
  gameId: string;
  isOffline?: boolean;
}

export default function Snake({ onGameEnd, sendGameState, isHost }: SnakeProps) {
  const hostStart: Position[] = [{ x: 4, y: 4 }];
  const guestStart: Position[] = [{ x: 15, y: 15 }];

  const [snake, setSnake] = useState<Position[]>(isHost ? hostStart : guestStart);
  const [food, setFood] = useState<Position>(isHost ? { x: 8, y: 4 } : { x: 11, y: 15 });
  const [direction, setDirection] = useState<Direction>(isHost ? 'RIGHT' : 'LEFT');
  const directionRef = useRef<Direction>(isHost ? 'RIGHT' : 'LEFT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [opponentSnake, setOpponentSnake] = useState<Position[]>([]);

  // Use a ref so the game loop always has the latest opponent snake without stale closure
  const opponentSnakeRef = useRef<Position[]>([]);
  const gameOverRef = useRef(false);

  useEffect(() => {
    opponentSnakeRef.current = opponentSnake;
  }, [opponentSnake]);

  // Listen for opponent's snake positions
  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type === 'snake' && Array.isArray(state.positions)) {
        setOpponentSnake(state.positions);
      }
    };
    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, []);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
  }, []);

  const checkCollision = useCallback((head: Position, currentSnake: Position[]) => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    if (currentSnake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) {
      return true;
    }
    // Opponent snake collision
    if (opponentSnakeRef.current.some(seg => seg.x === head.x && seg.y === head.y)) {
      return true;
    }
    return false;
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOverRef.current) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };

      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      if (checkCollision(head, prevSnake)) {
        gameOverRef.current = true;
        setGameOver(true);
        // The player who collides loses; opponent wins
        const winner = isHost ? 'guest' : 'host';
        onGameEnd(winner);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      sendGameState({ type: 'snake', positions: newSnake });

      return newSnake;
    });
  }, [food, checkCollision, generateFood, onGameEnd, sendGameState, isHost]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent reversing direction
      const update = (next: Direction) => {
        directionRef.current = next;
        setDirection(next);
      };
      switch (e.key) {
        case 'ArrowUp': if (directionRef.current !== 'DOWN') update('UP'); break;
        case 'ArrowDown': if (directionRef.current !== 'UP') update('DOWN'); break;
        case 'ArrowLeft': if (directionRef.current !== 'RIGHT') update('LEFT'); break;
        case 'ArrowRight': if (directionRef.current !== 'LEFT') update('RIGHT'); break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const interval = setInterval(moveSnake, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 text-white">
        <div className="text-xl font-bold">
          <span className="text-green-400">You: {score}</span>
        </div>
        <div className="text-sm text-gray-400 self-center">Use arrow keys to move</div>
      </div>
      <div
        className="grid bg-black/20 backdrop-blur-sm rounded-lg p-4"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: '1px',
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isMySnake = snake.some(seg => seg.x === x && seg.y === y);
          const isOpponentSnake = opponentSnake.some(seg => seg.x === x && seg.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm ${
                isMySnake ? 'bg-green-500' :
                isOpponentSnake ? 'bg-purple-500' :
                isFood ? 'bg-red-500' :
                'bg-white/5'
              }`}
            />
          );
        })}
      </div>
      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span> You</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span> Opponent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block"></span> Food</span>
      </div>
      {gameOver && (
        <div className="text-red-500 text-xl font-bold">Game Over!</div>
      )}
    </div>
  );
}

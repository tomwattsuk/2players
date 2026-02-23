import { useState, useEffect, useCallback } from 'react';

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

export default function Snake({ onGameEnd, sendGameState }: SnakeProps) {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    setFood(newFood);
    if (sendGameState) {
      sendGameState({ type: 'food', position: newFood });
    }
  }, [sendGameState]);

  const checkCollision = (head: Position) => {
    if (
      head.x < 0 || head.x >= GRID_SIZE ||
      head.y < 0 || head.y >= GRID_SIZE
    ) {
      return true;
    }
    return snake.slice(1).some(segment => 
      segment.x === head.x && segment.y === head.y
    );
  };

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };

      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      if (checkCollision(head)) {
        setGameOver(true);
        onGameEnd?.(score.toString());
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];
      
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1);
        generateFood();
      } else {
        newSnake.pop();
      }

      if (sendGameState) {
        sendGameState({ type: 'snake', positions: newSnake });
      }

      return newSnake;
    });
  }, [direction, food, gameOver, generateFood, onGameEnd, score, sendGameState]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': setDirection('UP'); break;
        case 'ArrowDown': setDirection('DOWN'); break;
        case 'ArrowLeft': setDirection('LEFT'); break;
        case 'ArrowRight': setDirection('RIGHT'); break;
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
      <div className="text-xl font-bold text-white">Score: {score}</div>
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
          const isSnake = snake.some(segment => segment.x === x && segment.y === y);
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={i}
              className={`w-5 h-5 rounded-sm ${
                isSnake ? 'bg-green-500' : 
                isFood ? 'bg-red-500' : 
                'bg-white/5'
              }`}
            />
          );
        })}
      </div>
      {gameOver && (
        <div className="text-red-500 text-xl font-bold">Game Over!</div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useInterval } from '../../hooks/useInterval';

interface SpaceShooterProps {
  onGameEnd: (winner: string | null) => void;
  isHost: boolean;
  sendGameState: (state: any) => void;
  gameId?: string;
  isOffline?: boolean;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed?: number;
}

interface GameState {
  player: GameObject;
  opponent: GameObject;
  bullets: GameObject[];
  enemies: GameObject[];
  score: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

const SpaceShooter = ({ onGameEnd, isHost, sendGameState }: SpaceShooterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: CANVAS_WIDTH / 2,
      y: isHost ? CANVAS_HEIGHT - 50 : 50,
      width: 40,
      height: 40,
      speed: 5
    },
    opponent: {
      x: CANVAS_WIDTH / 2,
      y: isHost ? 50 : CANVAS_HEIGHT - 50,
      width: 40,
      height: 40
    },
    bullets: [],
    enemies: [],
    score: 0
  });

  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useInterval(() => {
    if (isHost) {
      // Spawn enemies periodically
      if (Math.random() < 0.05) {
        const newEnemy: GameObject = {
          x: Math.random() * (CANVAS_WIDTH - 30),
          y: 0,
          width: 30,
          height: 30,
          speed: 2
        };
        setGameState(prev => ({
          ...prev,
          enemies: [...prev.enemies, newEnemy]
        }));
      }
    }
  }, 1000);

  useInterval(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update player position based on keyboard input
    const newState = { ...gameState };
    
    if (keys.ArrowLeft && newState.player.x > 0) {
      newState.player.x -= newState.player.speed!;
    }
    if (keys.ArrowRight && newState.player.x < CANVAS_WIDTH - newState.player.width) {
      newState.player.x += newState.player.speed!;
    }
    if (keys[' ']) {
      // Shoot bullets
      if (gameState.bullets.length < 5) {
        const bullet: GameObject = {
          x: newState.player.x + newState.player.width / 2 - 2,
          y: isHost ? newState.player.y - 10 : newState.player.y + newState.player.height,
          width: 4,
          height: 10,
          speed: 7
        };
        newState.bullets = [...newState.bullets, bullet];
      }
    }

    // Update bullets
    newState.bullets = newState.bullets
      .map(bullet => ({
        ...bullet,
        y: isHost ? bullet.y - bullet.speed! : bullet.y + bullet.speed!
      }))
      .filter(bullet => bullet.y > 0 && bullet.y < CANVAS_HEIGHT);

    // Update enemies
    if (isHost) {
      newState.enemies = newState.enemies
        .map(enemy => ({
          ...enemy,
          y: enemy.y + enemy.speed!
        }))
        .filter(enemy => {
          if (enemy.y > CANVAS_HEIGHT) {
            onGameEnd(null);
            return false;
          }
          return true;
        });

      // Check collisions
      newState.enemies = newState.enemies.filter(enemy => {
        const hitByBullet = newState.bullets.some(bullet => {
          const hit = checkCollision(bullet, enemy);
          if (hit) {
            newState.score += 10;
          }
          return hit;
        });
        return !hitByBullet;
      });

      newState.bullets = newState.bullets.filter(bullet => {
        return !newState.enemies.some(enemy => checkCollision(bullet, enemy));
      });
    }

    setGameState(newState);
    sendGameState({
      type: 'spaceshooter',
      data: newState
    });

    // Render game
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw player
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      newState.player.x,
      newState.player.y,
      newState.player.width,
      newState.player.height
    );

    // Draw opponent
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(
      newState.opponent.x,
      newState.opponent.y,
      newState.opponent.width,
      newState.opponent.height
    );

    // Draw bullets
    ctx.fillStyle = '#fff';
    newState.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw enemies
    ctx.fillStyle = '#ff00ff';
    newState.enemies.forEach(enemy => {
      ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

  }, 1000 / 60); // 60 FPS

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <span className="text-xl font-bold">Score: {gameState.score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-700 rounded-lg"
      />
      <div className="mt-4 text-sm text-gray-400">
        Use ← → to move, SPACE to shoot
      </div>
    </div>
  );
};

function checkCollision(a: GameObject, b: GameObject): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export default SpaceShooter;
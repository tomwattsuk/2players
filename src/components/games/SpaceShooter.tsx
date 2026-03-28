import { useEffect, useRef, useState } from 'react';

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

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ENEMY_SPEED = 2;

function checkCollision(a: GameObject, b: GameObject): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export default function SpaceShooter({ onGameEnd, isHost, sendGameState }: SpaceShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const gameActiveRef = useRef(true);

  const onGameEndRef = useRef(onGameEnd);
  const sendGameStateRef = useRef(sendGameState);
  useEffect(() => { onGameEndRef.current = onGameEnd; }, [onGameEnd]);
  useEffect(() => { sendGameStateRef.current = sendGameState; }, [sendGameState]);

  // All game physics in refs
  const playerRef = useRef<GameObject>({
    x: CANVAS_WIDTH / 2 - 20,
    y: CANVAS_HEIGHT - 60,
    width: 40,
    height: 40,
    speed: PLAYER_SPEED,
  });
  const bulletsRef = useRef<GameObject[]>([]);
  const enemiesRef = useRef<GameObject[]>([]);
  const scoreRef = useRef(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const lastShotRef = useRef(0);

  // Opponent data (received from the other player)
  const opponentXRef = useRef(CANVAS_WIDTH / 2 - 20);
  const opponentBulletsRef = useRef<GameObject[]>([]); // host receives guest bullets

  // Listen for incoming game state from opponent
  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type !== 'spaceshooter') return;

      // Update opponent ship position
      if (typeof state.playerX === 'number') {
        opponentXRef.current = state.playerX;
      }

      if (isHost) {
        // Host receives guest's bullets to check against enemies
        if (Array.isArray(state.bullets)) {
          opponentBulletsRef.current = state.bullets;
        }
      } else {
        // Guest receives enemy state from host
        if (Array.isArray(state.enemies)) {
          enemiesRef.current = state.enemies;
        }
        if (typeof state.score === 'number') {
          scoreRef.current = state.score;
          setScore(state.score);
        }
      }
    };
    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, [isHost]);

  // Key handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      e.preventDefault();
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameActiveRef.current = true;
    let frameId: number;
    let lastEnemySpawn = 0;
    let lastSend = 0;

    const loop = (timestamp: number) => {
      if (!gameActiveRef.current) return;

      const player = playerRef.current;
      const keys = keysRef.current;

      // Move player
      if (keys['ArrowLeft'] && player.x > 0) player.x -= PLAYER_SPEED;
      if (keys['ArrowRight'] && player.x < CANVAS_WIDTH - player.width) player.x += PLAYER_SPEED;

      // Shoot
      if (keys[' '] && timestamp - lastShotRef.current > 300) {
        lastShotRef.current = timestamp;
        if (bulletsRef.current.length < 5) {
          bulletsRef.current.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 10,
            width: 4,
            height: 12,
            speed: BULLET_SPEED,
          });
        }
      }

      // Move bullets upward
      bulletsRef.current = bulletsRef.current
        .map(b => ({ ...b, y: b.y - BULLET_SPEED }))
        .filter(b => b.y > -20);

      if (isHost) {
        // Spawn enemies
        if (timestamp - lastEnemySpawn > 1200) {
          lastEnemySpawn = timestamp;
          enemiesRef.current.push({
            x: Math.random() * (CANVAS_WIDTH - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: ENEMY_SPEED,
          });
        }

        // Move enemies down
        enemiesRef.current = enemiesRef.current.map(e => ({ ...e, y: e.y + ENEMY_SPEED }));

        // Check if any enemy reached the bottom
        if (enemiesRef.current.some(e => e.y > CANVAS_HEIGHT)) {
          gameActiveRef.current = false;
          onGameEndRef.current(null);
          return;
        }

        // Check collisions: own bullets vs enemies
        const ownHits = new Set<number>();
        const ownBulletHits = new Set<number>();
        bulletsRef.current.forEach((bullet, bi) => {
          enemiesRef.current.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
              ownHits.add(ei);
              ownBulletHits.add(bi);
            }
          });
        });

        // Check collisions: opponent (guest) bullets vs enemies
        const guestBulletHitIndices = new Set<number>();
        opponentBulletsRef.current.forEach((bullet, bi) => {
          enemiesRef.current.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
              ownHits.add(ei);
              guestBulletHitIndices.add(bi);
            }
          });
        });

        if (guestBulletHitIndices.size > 0) {
          opponentBulletsRef.current = opponentBulletsRef.current.filter((_, i) => !guestBulletHitIndices.has(i));
        }

        if (ownHits.size > 0) {
          scoreRef.current += ownHits.size * 10;
          setScore(scoreRef.current);
          enemiesRef.current = enemiesRef.current.filter((_, i) => !ownHits.has(i));
          bulletsRef.current = bulletsRef.current.filter((_, i) => !ownBulletHits.has(i));
        }

        // Send authoritative state to guest
        if (timestamp - lastSend > 50) {
          lastSend = timestamp;
          sendGameStateRef.current({
            type: 'spaceshooter',
            playerX: player.x,
            bullets: bulletsRef.current,
            enemies: enemiesRef.current,
            score: scoreRef.current,
          });
        }
      } else {
        // Guest: send position + bullets to host every ~50ms
        if (timestamp - lastSend > 50) {
          lastSend = timestamp;
          sendGameStateRef.current({
            type: 'spaceshooter',
            playerX: player.x,
            bullets: bulletsRef.current,
          });
        }
      }

      // ---- Render ----
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stars background
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + timestamp * 0.005) % CANVAS_WIDTH;
        const sy = (i * 137 + timestamp * 0.008) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // My ship (green triangle)
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(player.x + player.width / 2, player.y);
      ctx.lineTo(player.x, player.y + player.height);
      ctx.lineTo(player.x + player.width, player.y + player.height);
      ctx.closePath();
      ctx.fill();

      // Opponent ship (blue triangle)
      const opX = opponentXRef.current;
      ctx.fillStyle = '#60a5fa';
      ctx.beginPath();
      ctx.moveTo(opX + 20, 60);
      ctx.lineTo(opX, 60 - 40);
      ctx.lineTo(opX + 40, 60 - 40);
      ctx.closePath();
      ctx.fill();

      // My bullets
      ctx.fillStyle = '#facc15';
      bulletsRef.current.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      // Enemies (red)
      ctx.fillStyle = '#f87171';
      enemiesRef.current.forEach(e => {
        ctx.beginPath();
        ctx.moveTo(e.x + e.width / 2, e.y + e.height);
        ctx.lineTo(e.x, e.y);
        ctx.lineTo(e.x + e.width, e.y);
        ctx.closePath();
        ctx.fill();
      });

      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('You', player.x + player.width / 2, player.y - 6);
      ctx.fillText('Opponent', opX + 20, 15);

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameId);
      gameActiveRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex gap-6 items-center">
        <span className="text-xl font-bold text-white">Score: {score}</span>
        <span className="text-sm text-gray-400">← → to move · Space to shoot</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-700 rounded-lg"
        tabIndex={0}
      />
      <div className="mt-3 flex gap-4 text-sm text-gray-400">
        <span><span className="text-green-400">■</span> You</span>
        <span><span className="text-blue-400">■</span> Opponent</span>
        <span><span className="text-red-400">■</span> Enemies</span>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

interface Props {
  onGameEnd?: (winner: string | null) => void;
  isHost: boolean;
  sendGameState?: (state: any) => void;
  gameId?: string;
  isOffline?: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const PADDLE_HEIGHT = 10;
const PADDLE_WIDTH = 100;
const BALL_SIZE = 10;
const BALL_SPEED = 4;

export default function CoopPong({ onGameEnd, isHost, sendGameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => { onGameEndRef.current = onGameEnd; }, [onGameEnd]);

  // All game physics state lives in refs to avoid stale closures in the loop
  const ballPosRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const ballVelRef = useRef({ x: BALL_SPEED, y: BALL_SPEED });
  const paddle1Ref = useRef(CANVAS_WIDTH / 2); // top paddle (host)
  const paddle2Ref = useRef(CANVAS_WIDTH / 2); // bottom paddle (guest)
  const scoreRef = useRef(0);
  const gameActiveRef = useRef(true);

  // Sync opponent paddle from incoming game state
  useEffect(() => {
    const handleGameState = (e: CustomEvent) => {
      const state = e.detail;
      if (state.type !== 'cooppong') return;
      if (isHost && state.from === 'guest') {
        paddle2Ref.current = state.paddle;
      } else if (!isHost && state.from === 'host') {
        paddle1Ref.current = state.paddle;
      }
    };
    window.addEventListener('game_state', handleGameState as EventListener);
    return () => window.removeEventListener('game_state', handleGameState as EventListener);
  }, [isHost]);

  // Main game loop — runs once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameActiveRef.current = true;

    const gameLoop = setInterval(() => {
      if (!gameActiveRef.current) return;

      const ball = ballPosRef.current;
      const vel = ballVelRef.current;
      const p1 = paddle1Ref.current;
      const p2 = paddle2Ref.current;

      // Move ball
      ball.x += vel.x;
      ball.y += vel.y;

      // Wall bounce (left/right)
      if (ball.x <= BALL_SIZE) {
        ball.x = BALL_SIZE;
        vel.x = Math.abs(vel.x);
      }
      if (ball.x >= CANVAS_WIDTH - BALL_SIZE) {
        ball.x = CANVAS_WIDTH - BALL_SIZE;
        vel.x = -Math.abs(vel.x);
      }

      // Paddle 1 (top) collision
      if (
        ball.y <= PADDLE_HEIGHT + BALL_SIZE &&
        ball.y >= BALL_SIZE &&
        Math.abs(ball.x - p1) < PADDLE_WIDTH / 2
      ) {
        ball.y = PADDLE_HEIGHT + BALL_SIZE;
        vel.y = Math.abs(vel.y);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Paddle 2 (bottom) collision
      if (
        ball.y >= CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_SIZE &&
        ball.y <= CANVAS_HEIGHT - BALL_SIZE &&
        Math.abs(ball.x - p2) < PADDLE_WIDTH / 2
      ) {
        ball.y = CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_SIZE;
        vel.y = -Math.abs(vel.y);
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }

      // Ball escapes top or bottom — game over
      if (ball.y <= 0 || ball.y >= CANVAS_HEIGHT) {
        gameActiveRef.current = false;
        clearInterval(gameLoop);
        onGameEndRef.current?.('Score: ' + scoreRef.current);
        return;
      }

      // Render
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center line
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paddle 1 (top — host)
      ctx.fillStyle = isHost ? '#60a5fa' : '#a78bfa';
      ctx.beginPath();
      ctx.roundRect(p1 - PADDLE_WIDTH / 2, 0, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      ctx.fill();

      // Paddle 2 (bottom — guest)
      ctx.fillStyle = isHost ? '#a78bfa' : '#60a5fa';
      ctx.beginPath();
      ctx.roundRect(p2 - PADDLE_WIDTH / 2, CANVAS_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, 4);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Label paddles
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isHost ? 'You' : 'Opponent', p1, PADDLE_HEIGHT + 16);
      ctx.fillText(isHost ? 'Opponent' : 'You', p2, CANVAS_HEIGHT - PADDLE_HEIGHT - 6);

    }, 1000 / 60);

    return () => {
      clearInterval(gameLoop);
      gameActiveRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse/touch paddle control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = Math.max(
        PADDLE_WIDTH / 2,
        Math.min(CANVAS_WIDTH - PADDLE_WIDTH / 2, e.clientX - rect.left)
      );
      if (isHost) {
        paddle1Ref.current = mouseX;
      } else {
        paddle2Ref.current = mouseX;
      }
      sendGameState?.({
        type: 'cooppong',
        paddle: mouseX,
        from: isHost ? 'host' : 'guest',
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [isHost, sendGameState]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex gap-6 items-center">
        <span className="text-xl font-bold text-white">Score: {score}</span>
        <span className="text-sm text-gray-400">
          {isHost ? 'You control the top paddle' : 'You control the bottom paddle'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-700 rounded-lg cursor-none"
      />
      <div className="mt-4 text-sm text-gray-400">
        Move your mouse over the board to control your paddle
      </div>
    </div>
  );
}

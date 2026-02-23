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
const BALL_SPEED = 5;

export default function CoopPong({ onGameEnd, isHost, sendGameState }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddle1Pos, setPaddle1Pos] = useState(CANVAS_WIDTH / 2);
  const [paddle2Pos, setPaddle2Pos] = useState(CANVAS_WIDTH / 2);
  const [ballPos, setBallPos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });
  const [ballVelocity, setBallVelocity] = useState({ x: BALL_SPEED, y: BALL_SPEED });
  const [score, setScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = setInterval(() => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw paddles
      ctx.fillStyle = '#fff';
      ctx.fillRect(paddle1Pos - PADDLE_WIDTH / 2, 0, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(paddle2Pos - PADDLE_WIDTH / 2, CANVAS_HEIGHT - PADDLE_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw ball
      ctx.beginPath();
      ctx.arc(ballPos.x, ballPos.y, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Update ball position
      setBallPos(prev => ({
        x: prev.x + ballVelocity.x,
        y: prev.y + ballVelocity.y
      }));

      // Ball collision with walls
      if (ballPos.x <= BALL_SIZE || ballPos.x >= CANVAS_WIDTH - BALL_SIZE) {
        setBallVelocity(prev => ({ ...prev, x: -prev.x }));
      }

      // Ball collision with paddles
      if (
        (ballPos.y <= PADDLE_HEIGHT + BALL_SIZE && 
         Math.abs(ballPos.x - paddle1Pos) < PADDLE_WIDTH / 2) ||
        (ballPos.y >= CANVAS_HEIGHT - PADDLE_HEIGHT - BALL_SIZE && 
         Math.abs(ballPos.x - paddle2Pos) < PADDLE_WIDTH / 2)
      ) {
        setBallVelocity(prev => ({ ...prev, y: -prev.y }));
        setScore(prev => prev + 1);
      }

      // Game over if ball passes paddles
      if (ballPos.y <= 0 || ballPos.y >= CANVAS_HEIGHT) {
        clearInterval(gameLoop);
        onGameEnd?.('Score: ' + score);
      }
    }, 1000 / 60);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      if (isHost) {
        setPaddle1Pos(mouseX);
        sendGameState?.({ type: 'PADDLE1_MOVE', position: mouseX });
      } else {
        setPaddle2Pos(mouseX);
        sendGameState?.({ type: 'PADDLE2_MOVE', position: mouseX });
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(gameLoop);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [ballPos, ballVelocity, paddle1Pos, paddle2Pos, score]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4">
        <span className="text-xl font-bold">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border border-gray-700 rounded-lg"
      />
      <div className="mt-4 text-sm text-gray-400">
        Move your mouse to control your paddle
      </div>
    </div>
  );
}

import React from 'react';
import { Ship, Target, Lock } from 'lucide-react';

interface GameStatusProps {
  gameOver: boolean;
  winner: string | null;
  isPlacing: boolean;
  isLocked: boolean;
  isMyTurn: boolean;
  opponentReady: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  gameOver,
  winner,
  isPlacing,
  isLocked,
  isMyTurn,
  opponentReady
}) => {
  return (
    <div className="flex items-center justify-center h-16 px-6 mb-6 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/5">
      <div className="text-xl font-bold flex items-center gap-3">
        {gameOver ? (
          <span className={winner === 'You' ? 'text-green-500' : 'text-red-500'}>
            {winner} {winner === 'You' ? 'Win!' : 'Wins!'}
          </span>
        ) : isPlacing ? (
          <div className="flex items-center gap-2">
            {isLocked ? (
              <>
                <Lock className="text-yellow-400 animate-pulse" />
                <span className="text-yellow-400">
                  {opponentReady ? 'Starting game...' : 'Waiting for opponent...'}
                </span>
              </>
            ) : (
              <>
                <Ship className="text-blue-400" />
                <span>Place your ships</span>
              </>
            )}
          </div>
        ) : isMyTurn ? (
          <div className="flex items-center gap-2">
            <Target className="text-red-400 animate-pulse" />
            <span className="text-red-400">Your turn to fire!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-yellow-400">Enemy is targeting...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatus;
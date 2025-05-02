
import React from 'react';
import { Gamepad2, Ship, Target, Crown } from 'lucide-react';
import GameArea from './GameArea';

const PlayNow: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
          Choose Your Game
        </h1>
        
        <GameArea />
      </div>
    </div>
  );
};

export default PlayNow;

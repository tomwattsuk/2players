
import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import GameArea from './GameArea';

const PlayNow: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
            2Players is more fun when you're logged in!
          </h1>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Sign up to unlock:</h2>
            <ul className="text-left space-y-3 text-gray-300 mb-6">
              <li>✨ Add friends and build your gaming circle</li>
              <li>💬 Chat with other players during games</li>
              <li>🏆 Track your stats and achievements</li>
              <li>🎮 Play with the entire community</li>
            </ul>
            <button 
              onClick={() => document.getElementById('auth-modal')?.click()}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Log in / Sign up
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">Want to try it first?</p>
            <button 
              onClick={() => window.location.hash = '#guest'}
              className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition"
            >
              Continue as Guest
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Note: Guest players can only play with other guests
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
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


import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import GameArea from './GameArea';
import { Users, MessageSquare, Trophy, Crown } from 'lucide-react';

const PlayNow: React.FC = () => {
  const { user } = useAuthStore();
  const [isGuest, setIsGuest] = useState(window.location.hash === '#guest');

  useEffect(() => {
    const handleHashChange = () => {
      setIsGuest(window.location.hash === '#guest');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleGuestContinue = () => {
    window.location.hash = 'guest';
    setIsGuest(true);
  };

  if (!user && !isGuest) {
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
              Start Playing Now
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">Want to try it first?</p>
            <button 
              onClick={handleGuestContinue}
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
        {isGuest && (
          <div className="mb-8 p-4 bg-white/5 backdrop-blur-lg rounded-lg">
            <p className="text-amber-400 text-center">
              Playing as guest - Some features are limited. 
              <button 
                onClick={() => document.getElementById('auth-modal')?.click()}
                className="text-white underline ml-2 hover:text-pink-500"
              >
                Sign up now
              </button>
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
            Choose Your Game
          </h1>
          <p className="text-gray-400">
            Challenge players and have fun!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {!isGuest && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Your Stats</h2>
                <Trophy className="w-6 h-6 text-amber-400" />
              </div>
              <div className="space-y-2 text-gray-300">
                <p>Games Played: 0</p>
                <p>Wins: 0</p>
                <p>Win Rate: 0%</p>
              </div>
            </div>
          )}

          {!isGuest && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Friends Online</h2>
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-gray-400">No friends online</p>
            </div>
          )}

          {!isGuest && (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <MessageSquare className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-gray-400">No recent activity</p>
            </div>
          )}
        </div>

        <GameArea />
      </div>
    </div>
  );
};

export default PlayNow;

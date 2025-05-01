import React from 'react';
import { User, Trophy, Star } from 'lucide-react';

const ProfileCard = () => {
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
          <User size={32} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Anonymous Player</h3>
          <p className="text-gray-400">Online Now</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white bg-opacity-5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={20} className="text-yellow-500" />
            <span className="text-white">Wins</span>
          </div>
          <p className="text-2xl font-bold text-white">24</p>
        </div>
        <div className="bg-white bg-opacity-5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star size={20} className="text-yellow-500" />
            <span className="text-white">Rating</span>
          </div>
          <p className="text-2xl font-bold text-white">4.8</p>
        </div>
      </div>

      <button className="w-full px-4 py-2 bg-white bg-opacity-5 text-white rounded-lg hover:bg-opacity-10 transition">
        View Full Profile
      </button>
    </div>
  );
};

export default ProfileCard;
import React, { useState } from 'react';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

export default function UserMenu() {
  const { user, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
            </span>
          </div>
        )}
        <span className="hidden md:inline">{user.displayName || 'User'}</span>
        <ChevronDown size={16} className={`transform transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl shadow-xl py-1 z-50">
          <button
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to profile
            }}
            className="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-5 transition flex items-center gap-2"
          >
            <User size={16} />
            Profile
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              // TODO: Navigate to settings
            }}
            className="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-5 transition flex items-center gap-2"
          >
            <Settings size={16} />
            Settings
          </button>
          <hr className="my-1 border-white border-opacity-10" />
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full px-4 py-2 text-left hover:bg-white hover:bg-opacity-5 transition flex items-center gap-2 text-red-400"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
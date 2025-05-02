
import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

const Navbar = () => {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white bg-opacity-10 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Gamepad className="text-pink-500" size={28} />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
              2Players.io
            </span>
          </div>

          <div className="flex items-center gap-6">
            {user && (
              <>
                <button className="nav-button">
                  <Users size={20} />
                  <span>Friends</span>
                </button>
                <button className="nav-button">
                  <MessageSquare size={20} />
                  <span>Messages</span>
                </button>
              </>
            )}
            <Link 
              to="/play"
              className="ml-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg hover:opacity-90 transition"
            >
              Play Now
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

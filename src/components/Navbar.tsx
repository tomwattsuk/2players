import { Link } from 'react-router-dom';
import { Gamepad } from 'lucide-react';
import { useOnlinePlayers } from '../hooks/useOnlinePlayers';

const Navbar = () => {
  const { onlinePlayers, isConnected } = useOnlinePlayers();

  return (
    <nav className="bg-white bg-opacity-10 backdrop-blur-lg border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Gamepad className="text-pink-500" size={28} />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
              2Players.io
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {isConnected && onlinePlayers > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {onlinePlayers} online
              </div>
            )}
            <Link
              to="/play"
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg hover:opacity-90 transition"
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

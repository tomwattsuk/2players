import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuthStore } from './stores/useAuthStore';
import GameArea from './components/GameArea';
import Navbar from './components/Navbar';
import { Users, Gamepad2, MessageSquare, Globe } from 'lucide-react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Added for routing
import PlayNow from './components/PlayNow'; // Import the PlayNow component


const App: React.FC = () => {
  const { onlinePlayers, isConnected } = useWebSocket();
  const { user, loading } = useAuthStore();

  const features = [
    {
      icon: <Gamepad2 className="w-8 h-8 text-pink-500" />,
      title: "Real-time Multiplayer",
      description: "Challenge players worldwide in classic games like Battleships, Tic Tac Toe, and Checkers"
    },
    {
      icon: <Users className="w-8 h-8 text-violet-500" />,
      title: "Make New Friends",
      description: "Connect with players, send friend requests, and build your gaming circle"
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-500" />,
      title: "Live Chat",
      description: "Chat with your opponents during games and make new connections"
    },
    {
      icon: <Globe className="w-8 h-8 text-green-500" />,
      title: "Global Community",
      description: "Join players from around the world in friendly competition"
    }
  ];

  return (
    <Router> {/* Added Router for routing */}
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-slate-900 to-black">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes> {/* Added Routes for routing */}
            <Route path="/" element={
              <>
                {!user && !loading ? (
                  <div className="py-12 sm:py-20">
                    <div className="text-center mb-16">
                      <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
                        Play Games. Meet People.
                      </h1>
                      <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Challenge players worldwide in real-time multiplayer games and make new friends along the way.
                      </p>
                      {isConnected && onlinePlayers > 0 && (
                        <p className="text-green-400 text-lg animate-pulse">
                          {onlinePlayers} Players Online Now
                        </p>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                      {features.map((feature, index) => (
                        <div
                          key={index}
                          className="bg-white/5 backdrop-blur-lg rounded-xl p-6 hover:bg-white/10 transition"
                        >
                          <div className="mb-4">{feature.icon}</div>
                          <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => window.location.href = '/play'}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-lg text-lg font-semibold hover:opacity-90 transition"
                      >
                        Start Playing Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <GameArea />
                  </div>
                )}
              </>
            } />
            <Route path="/play" element={<PlayNow />} /> {/* Added route for PlayNow */}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
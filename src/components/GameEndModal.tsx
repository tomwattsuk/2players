import React, { useState, useEffect } from 'react';
import { UserPlus, Home, RefreshCw } from 'lucide-react';

interface GameEndModalProps {
  show: boolean;
  gameType: 'checkers' | 'tictactoe' | 'spaceshooter';
  winner: string | null;
  opponentDisconnected?: boolean;
  onMainMenu: () => void;
  onRequeue: () => void;
  onFriendRequest: () => void;
}

export default function GameEndModal({
  show,
  gameType,
  winner,
  opponentDisconnected = false,
  onMainMenu,
  onRequeue,
  onFriendRequest
}: GameEndModalProps) {
  const [showFriendRequest, setShowFriendRequest] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  useEffect(() => {
    if (show && !opponentDisconnected) {
      setShowFriendRequest(true);
    }
  }, [show, opponentDisconnected]);

  if (!show) return null;

  const gameTypeName = {
    checkers: 'Checkers',
    tictactoe: 'Tic Tac Toe',
    spaceshooter: 'Space Shooter'
  }[gameType];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full">
        {opponentDisconnected ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-red-400">Your opponent has left!</h2>
            <p className="text-gray-300 mb-6">
              Would you like to return to the main menu or find a new opponent?
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">
              {winner ? `${winner} Wins!` : "It's a Draw!"}
            </h2>
            {showFriendRequest && !friendRequestSent && (
              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Would you like to add your opponent as a friend?
                </p>
                <button
                  onClick={() => {
                    setFriendRequestSent(true);
                    onFriendRequest();
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                  <UserPlus size={20} />
                  Send Friend Request
                </button>
              </div>
            )}
            {friendRequestSent && (
              <p className="text-green-400 mb-6">
                Friend request sent! They'll need to accept it too.
              </p>
            )}
          </>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onMainMenu}
            className="px-4 py-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Main Menu
          </button>
          <button
            onClick={onRequeue}
            className="px-4 py-3 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Play {gameTypeName} Again
          </button>
        </div>
      </div>
    </div>
  );
}
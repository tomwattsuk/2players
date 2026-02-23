import { useGuestStore } from '../stores/useGuestStore';
import GameArea from './GameArea';
import CommunicationSetup from './CommunicationSetup';
import { Video, Mic, MessageSquare, RefreshCw } from 'lucide-react';

const PlayNow: React.FC = () => {
  const { hasCompletedSetup, username, communicationType, resetGuest } = useGuestStore();

  const handleSetupComplete = () => {
    // The store is already updated by CommunicationSetup
    // This just triggers a re-render
  };

  const getCommunicationIcon = () => {
    switch (communicationType) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCommunicationLabel = () => {
    switch (communicationType) {
      case 'video':
        return 'Video Chat';
      case 'audio':
        return 'Voice Chat';
      default:
        return 'Text Chat';
    }
  };

  // Show setup flow if not completed
  if (!hasCompletedSetup) {
    return <CommunicationSetup onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Player Info Bar */}
        <div className="mb-8 p-4 bg-white/5 backdrop-blur-lg rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 flex items-center justify-center text-white font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{username}</p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {getCommunicationIcon()}
                <span>{getCommunicationLabel()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={resetGuest}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Change Settings
          </button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
            Choose Your Game
          </h1>
          <p className="text-gray-400">
            Challenge players and have fun!
          </p>
        </div>

        <GameArea />
      </div>
    </div>
  );
};

export default PlayNow;

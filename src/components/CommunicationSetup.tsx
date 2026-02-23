import { useState } from 'react';
import { Video, Mic, MessageSquare, Check, AlertCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGuestStore, type CommunicationType } from '../stores/useGuestStore';
import { checkMediaPermissions } from '../hooks/useWebRTC';

interface CommunicationSetupProps {
  onComplete: () => void;
}

export default function CommunicationSetup({ onComplete }: CommunicationSetupProps) {
  const { username, setUsername, setCommunicationType, setMediaPermissionsGranted, completeSetup } = useGuestStore();
  const [selectedType, setSelectedType] = useState<CommunicationType | null>(null);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const options = [
    {
      type: 'video' as CommunicationType,
      icon: Video,
      title: 'Video Chat',
      description: 'See and hear your opponent with webcam and microphone',
      color: 'pink'
    },
    {
      type: 'audio' as CommunicationType,
      icon: Mic,
      title: 'Voice Chat',
      description: 'Talk to your opponent using your microphone',
      color: 'violet'
    },
    {
      type: 'text' as CommunicationType,
      icon: MessageSquare,
      title: 'Text Only',
      description: 'Chat with your opponent using text messages',
      color: 'blue'
    }
  ];

  const validateUsername = (value: string) => {
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (value.length > 20) {
      return 'Username must be less than 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleContinue = async () => {
    // Validate username
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }

    if (!selectedType) return;

    setPermissionError(null);

    // For text-only, no permissions needed
    if (selectedType === 'text') {
      setCommunicationType(selectedType);
      completeSetup();
      onComplete();
      return;
    }

    // For video/audio, check permissions
    setIsCheckingPermissions(true);

    try {
      const hasPermission = await checkMediaPermissions(selectedType === 'video' ? 'video' : 'audio');

      if (hasPermission) {
        setMediaPermissionsGranted(true);
        setCommunicationType(selectedType);
        completeSetup();
        onComplete();
      } else {
        setPermissionError(
          selectedType === 'video'
            ? 'Camera or microphone access was denied. Please allow access in your browser settings or choose text chat.'
            : 'Microphone access was denied. Please allow access in your browser settings or choose text chat.'
        );
      }
    } catch (err) {
      setPermissionError('Unable to access media devices. Please check your browser settings or choose text chat.');
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-transparent bg-clip-text">
            Welcome to 2Players
          </h1>
          <p className="text-gray-400">
            Set up your profile and choose how you want to communicate with opponents
          </p>
        </div>

        {/* Username Input */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-pink-500" />
            <h2 className="text-xl font-semibold text-white">Your Username</h2>
          </div>
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your username"
          />
          {usernameError && (
            <p className="mt-2 text-sm text-red-400">{usernameError}</p>
          )}
        </div>

        {/* Communication Options */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">How do you want to communicate?</h2>

          <div className="space-y-3">
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedType === option.type;

              return (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedType(option.type);
                    setPermissionError(null);
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left ${
                    isSelected
                      ? `border-${option.color}-500 bg-${option.color}-500/10`
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isSelected ? `bg-${option.color}-500` : 'bg-white/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                  {isSelected && (
                    <Check className={`w-6 h-6 text-${option.color}-500`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Permission Error */}
        {permissionError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{permissionError}</p>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedType || isCheckingPermissions || !!usernameError}
          className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingPermissions ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Checking permissions...
            </span>
          ) : (
            'Start Playing'
          )}
        </button>

        {selectedType && selectedType !== 'text' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Your browser will ask for {selectedType === 'video' ? 'camera and microphone' : 'microphone'} access
          </p>
        )}
      </motion.div>
    </div>
  );
}

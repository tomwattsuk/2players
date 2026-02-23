import { useEffect, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useGuestStore } from '../stores/useGuestStore';

interface VideoChatProps {
  gameId: string;
  playerId: string;
  isHost: boolean;
}

export default function VideoChat({ gameId, playerId, isHost }: VideoChatProps) {
  const { communicationType } = useGuestStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const {
    localVideoRef,
    remoteVideoRef,
    isConnecting,
    isConnected,
    error,
    initializeConnection,
    toggleMute,
    toggleVideo,
    cleanup
  } = useWebRTC({
    gameId,
    playerId,
    isHost,
    communicationType: communicationType || 'text'
  });

  useEffect(() => {
    if (gameId && communicationType && communicationType !== 'text') {
      initializeConnection();
    }

    return () => {
      cleanup();
    };
  }, [gameId, communicationType, initializeConnection, cleanup]);

  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = () => {
    const videoOff = toggleVideo();
    setIsVideoOff(videoOff);
  };

  // Text-only mode - no video chat UI
  if (!communicationType || communicationType === 'text') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-3 shadow-xl border border-white/10">
        {/* Video displays */}
        {communicationType === 'video' && (
          <div className="flex gap-2 mb-3">
            {/* Remote video (opponent) */}
            <div className="relative w-32 h-24 bg-slate-900 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {!isConnected && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                  {isConnecting ? 'Connecting...' : 'Waiting...'}
                </div>
              )}
            </div>

            {/* Local video (you) */}
            <div className="relative w-20 h-15 bg-slate-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {isVideoOff && (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <VideoOff className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio-only status */}
        {communicationType === 'audio' && (
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <span className="text-sm text-gray-300">
              {isConnected ? 'Voice connected' : isConnecting ? 'Connecting...' : 'Waiting for opponent'}
            </span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-lg transition ${
              isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {communicationType === 'video' && (
            <button
              onClick={handleToggleVideo}
              className={`p-2 rounded-lg transition ${
                isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={cleanup}
            className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition"
            title="End call"
          >
            <Phone className="w-5 h-5 rotate-[135deg]" />
          </button>
        </div>

        {/* Error display */}
        {error && (
          <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

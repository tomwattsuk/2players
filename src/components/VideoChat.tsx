import { useEffect, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, Flag } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useGuestStore } from '../stores/useGuestStore';
import ReportModal from './ReportModal';

interface VideoChatProps {
  gameId: string;
  playerId: string;
  isHost: boolean;
  opponentUsername?: string | null;
  opponentCountry?: string | null;
}

export default function VideoChat({ gameId, playerId, isHost, opponentUsername, opponentCountry }: VideoChatProps) {
  const { communicationType } = useGuestStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showReport, setShowReport] = useState(false);

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

  // Text-only mode — no video chat UI
  if (!communicationType || communicationType === 'text') {
    return null;
  }

  const connectionStatusText = isConnected
    ? 'Voice connected'
    : isConnecting
    ? 'Connecting...'
    : 'Waiting for opponent';

  return (
    <>
      <div
        role="region"
        aria-label="Video communication"
        className="fixed bottom-4 right-4 z-40"
      >
        <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-3 shadow-xl border border-white/10">
          {/* Opponent info */}
          {(opponentUsername || opponentCountry) && (
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs text-gray-400 truncate">
                {opponentUsername && <span className="text-white font-medium">{opponentUsername}</span>}
                {opponentUsername && opponentCountry && <span className="mx-1 text-gray-600" aria-hidden="true">·</span>}
                {opponentCountry && <span>{opponentCountry}</span>}
              </p>
              <button
                onClick={() => setShowReport(true)}
                aria-label="Report player"
                title="Report player"
                className="ml-2 text-gray-500 hover:text-red-400 transition flex-shrink-0"
              >
                <Flag className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Video displays */}
          {communicationType === 'video' && (
            <div className="flex gap-2 mb-3" aria-label="Video feeds">
              {/* Remote video (opponent) */}
              <div className="relative w-32 h-24 bg-slate-900 rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  aria-label={`${opponentUsername || 'Opponent'}'s video feed`}
                  className="w-full h-full object-cover"
                />
                {!isConnected && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs" aria-hidden="true">
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
                  aria-label="Your video preview"
                  className="w-full h-full object-cover mirror"
                />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center" aria-hidden="true">
                    <VideoOff className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connection status — live region for both audio and video */}
          <div
            aria-live="polite"
            aria-label="Connection status"
            className={communicationType === 'audio' ? 'flex items-center gap-2 mb-3 px-2' : 'sr-only'}
          >
            {communicationType === 'audio' && (
              <>
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-300">{connectionStatusText}</span>
              </>
            )}
            {communicationType === 'video' && (
              <span className="sr-only">{connectionStatusText}</span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2" role="group" aria-label="Call controls">
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              aria-pressed={isMuted}
              className={`p-2 rounded-lg transition ${
                isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
            </button>

            {communicationType === 'video' && (
              <button
                onClick={handleToggleVideo}
                aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                aria-pressed={isVideoOff}
                className={`p-2 rounded-lg transition ${
                  isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" aria-hidden="true" /> : <Video className="w-5 h-5" aria-hidden="true" />}
              </button>
            )}

            <button
              onClick={cleanup}
              aria-label="End call"
              className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" aria-hidden="true" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <p role="alert" aria-live="assertive" className="mt-2 text-xs text-red-400 text-center">
              {error}
            </p>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        gameId={gameId}
        reporterId={playerId}
      />
    </>
  );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { database, ref, set, onValue, remove, push } from '../lib/firebase';
import type { CommunicationType } from '../stores/useGuestStore';

interface WebRTCConfig {
  gameId: string;
  playerId: string;
  isHost: boolean;
  communicationType: CommunicationType;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

export function useWebRTC({ gameId, playerId, isHost, communicationType }: WebRTCConfig) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Request media permissions and get stream
  const requestMediaAccess = useCallback(async () => {
    if (communicationType === 'text') {
      return null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: communicationType === 'video' || communicationType === 'audio',
        video: communicationType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && communicationType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      return null;
    }
  }, [communicationType]);

  // Initialize WebRTC connection
  const initializeConnection = useCallback(async () => {
    if (!gameId || communicationType === 'text') return;

    setIsConnecting(true);
    setError(null);

    try {
      // Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnection.current = pc;

      // Set up remote stream handling
      pc.ontrack = (event) => {
        const [stream] = event.streams;
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      };

      // Add local stream tracks
      const stream = await requestMediaAccess();
      if (stream) {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = push(ref(database, `webrtc/${gameId}/candidates/${playerId}`));
          set(candidateRef, event.candidate.toJSON());
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log('[WebRTC] Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setError('Connection lost');
        }
      };

      // Signaling logic
      if (isHost) {
        // Host creates offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await set(ref(database, `webrtc/${gameId}/offer`), {
          type: offer.type,
          sdp: offer.sdp
        });

        // Listen for answer
        const answerRef = ref(database, `webrtc/${gameId}/answer`);
        onValue(answerRef, async (snapshot) => {
          if (snapshot.exists() && pc.currentRemoteDescription === null) {
            const answer = snapshot.val();
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });
      } else {
        // Guest waits for offer then creates answer
        const offerRef = ref(database, `webrtc/${gameId}/offer`);
        onValue(offerRef, async (snapshot) => {
          if (snapshot.exists() && pc.currentRemoteDescription === null) {
            const offer = snapshot.val();
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await set(ref(database, `webrtc/${gameId}/answer`), {
              type: answer.type,
              sdp: answer.sdp
            });
          }
        });
      }

      // Listen for ICE candidates from the other player
      const otherPlayerId = isHost ? 'guest' : 'host';
      const candidatesRef = ref(database, `webrtc/${gameId}/candidates/${otherPlayerId}`);
      onValue(candidatesRef, (snapshot) => {
        if (snapshot.exists()) {
          const candidates = snapshot.val();
          Object.values(candidates).forEach((candidate: any) => {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
          });
        }
      });

    } catch (err) {
      console.error('Error initializing WebRTC:', err);
      setError('Failed to establish video/audio connection');
      setIsConnecting(false);
    }
  }, [gameId, playerId, isHost, communicationType, requestMediaAccess]);

  // Clean up
  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (gameId) {
      // Clean up Firebase signaling data
      remove(ref(database, `webrtc/${gameId}`));
    }

    setRemoteStream(null);
    setIsConnected(false);
    setIsConnecting(false);
  }, [gameId, localStream]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return !audioTracks[0]?.enabled;
    }
    return false;
  }, [localStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      return !videoTracks[0]?.enabled;
    }
    return false;
  }, [localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    isConnecting,
    isConnected,
    error,
    initializeConnection,
    requestMediaAccess,
    cleanup,
    toggleMute,
    toggleVideo
  };
}

// Helper function to check if media devices are available
export async function checkMediaPermissions(type: 'video' | 'audio'): Promise<boolean> {
  try {
    const constraints: MediaStreamConstraints = {
      audio: true,
      video: type === 'video'
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    // Stop all tracks immediately after checking
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.error('Media permission check failed:', err);
    return false;
  }
}

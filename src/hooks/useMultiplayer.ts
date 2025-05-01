import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { GameState } from '../types/game';

interface ChatMessage {
  sender: string;
  message: string;
  isMe: boolean;
}

const MIN_MATCHMAKING_TIME = 3000; // 3 seconds minimum wait

export function useMultiplayer() {
  const [gameId, setGameId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [matchStartTime, setMatchStartTime] = useState<number>(0);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const { isConnected, isOffline, lastError, sendMessage, lastMessage, reconnect } = useWebSocket();

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'game_matched':
        const currentTime = Date.now();
        const timeElapsed = currentTime - matchStartTime;
        
        if (timeElapsed < MIN_MATCHMAKING_TIME) {
          setTimeout(() => {
            setGameId(lastMessage.data.gameId);
            setIsHost(lastMessage.data.isHost);
            setIsMatchmaking(false);
            setMessages([]);
            setOpponentLeft(false);
          }, MIN_MATCHMAKING_TIME - timeElapsed);
        } else {
          setGameId(lastMessage.data.gameId);
          setIsHost(lastMessage.data.isHost);
          setIsMatchmaking(false);
          setMessages([]);
          setOpponentLeft(false);
        }
        break;
      
      case 'matchmaking_status':
        setIsMatchmaking(lastMessage.data.status === 'waiting');
        if (lastMessage.data.status === 'timeout') {
          setGameId('');
          setIsHost(false);
          setIsMatchmaking(false);
        }
        break;
        
      case 'player_disconnected':
        setOpponentLeft(true);
        break;

      case 'game_state':
        window.dispatchEvent(new CustomEvent('game_state', { 
          detail: lastMessage.data 
        }));
        break;

      case 'chat':
        setMessages(prev => [...prev, {
          sender: lastMessage.data.sender,
          message: lastMessage.data.message,
          isMe: false
        }]);
        break;

      case 'friend_request':
        if (lastMessage.data.status === 'accepted') {
          // Handle accepted friend request
          console.log('Friend request accepted!');
        }
        break;
    }
  }, [lastMessage, matchStartTime]);

  const createGame = useCallback((gameType: string) => {
    if (!isConnected || isMatchmaking) return;

    setIsMatchmaking(true);
    setMatchStartTime(Date.now());
    
    sendMessage({
      type: 'matchmaking',
      data: {
        gameType,
        action: 'find_match'
      }
    });
  }, [isConnected, sendMessage, isMatchmaking]);

  const sendGameState = useCallback((state: GameState) => {
    if (!gameId) return;
    
    sendMessage({
      type: 'game_state',
      data: {
        ...state,
        gameId
      }
    });
  }, [sendMessage, gameId]);

  const sendChat = useCallback((message: string) => {
    if (!gameId) return;

    sendMessage({
      type: 'chat',
      data: {
        gameId,
        message
      }
    });

    setMessages(prev => [...prev, {
      sender: 'me',
      message,
      isMe: true
    }]);
  }, [sendMessage, gameId]);

  const sendFriendRequest = useCallback((gameId: string) => {
    sendMessage({
      type: 'friend_request',
      data: { gameId }
    });
  }, [sendMessage]);

  return {
    gameId,
    isHost,
    isConnected,
    isOffline,
    lastError,
    isMatchmaking,
    messages,
    opponentLeft,
    createGame,
    sendGameState,
    sendChat,
    sendFriendRequest,
    reconnect
  };
}
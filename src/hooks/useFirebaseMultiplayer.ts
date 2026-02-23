import { useEffect, useState, useCallback, useRef } from 'react';
import {
  database,
  ref,
  set,
  get,
  push,
  onValue,
  off,
  remove,
  update,
  onDisconnect
} from '../lib/firebase';
import type { GameState } from '../types/game';

interface ChatMessage {
  sender: string;
  message: string;
  isMe: boolean;
  timestamp?: number;
}

interface GameData {
  host: string;
  guest: string | null;
  gameType: string;
  state: any;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

const MIN_MATCHMAKING_TIME = 2000;

export function useFirebaseMultiplayer() {
  const [gameId, setGameId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  const playerId = useRef<string>(Math.random().toString(36).substring(7));
  const matchStartTime = useRef<number>(0);
  const gameRef = useRef<any>(null);
  const chatRef = useRef<any>(null);
  const waitingRef = useRef<any>(null);

  // Check Firebase connection
  useEffect(() => {
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      console.log(`[2Players] Firebase connected: ${connected}`);
      setIsConnected(connected);
      setIsOffline(!connected);
      if (!connected) {
        setLastError('Connecting to game server...');
      } else {
        setLastError(null);
      }
    });

    // Track online players
    const presenceRef = ref(database, `presence/${playerId.current}`);
    set(presenceRef, true);
    onDisconnect(presenceRef).remove();

    const allPresenceRef = ref(database, 'presence');
    onValue(allPresenceRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      setOnlinePlayers(count);
    });

    return () => {
      off(connectedRef);
      off(allPresenceRef);
      remove(presenceRef);
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (waitingRef.current) {
        remove(waitingRef.current);
      }
      if (gameRef.current) {
        off(gameRef.current);
      }
      if (chatRef.current) {
        off(chatRef.current);
      }
    };
  }, []);

  const createGame = useCallback(async (gameType: string) => {
    if (isMatchmaking) return;

    console.log(`[2Players] Starting matchmaking for ${gameType}...`);
    console.log(`[2Players] My player ID: ${playerId.current}`);

    setIsMatchmaking(true);
    setOpponentLeft(false);
    setMessages([]);
    matchStartTime.current = Date.now();

    try {
      // Check for waiting players
      const waitingListRef = ref(database, `matchmaking/${gameType}`);
      const snapshot = await get(waitingListRef);
      console.log(`[2Players] Checking for waiting players...`);

      if (snapshot.exists()) {
        const waitingPlayers = snapshot.val();
        const waitingIds = Object.keys(waitingPlayers);
        console.log(`[2Players] Found ${waitingIds.length} waiting player(s):`, waitingPlayers);

        // Find first valid waiting player (not ourselves)
        for (const odId of waitingIds) {
          console.log(`[2Players] Checking player ${waitingPlayers[odId].playerId} vs me ${playerId.current}`);
          if (waitingPlayers[odId].playerId !== playerId.current) {
            // Found a match! Join their game
            const existingGameId = waitingPlayers[odId].gameId;
            console.log(`[2Players] MATCH FOUND! Joining game ${existingGameId}`);

            // Remove them from waiting list
            await remove(ref(database, `matchmaking/${gameType}/${odId}`));

            // Update game with our presence
            const gameDataRef = ref(database, `games/${existingGameId}`);
            await update(gameDataRef, {
              guest: playerId.current,
              status: 'playing'
            });

            // Set up as guest
            setIsHost(false);
            setGameId(existingGameId);

            // Add minimum matchmaking delay for UX
            const elapsed = Date.now() - matchStartTime.current;
            if (elapsed < MIN_MATCHMAKING_TIME) {
              await new Promise(resolve => setTimeout(resolve, MIN_MATCHMAKING_TIME - elapsed));
            }

            setIsMatchmaking(false);
            subscribeToGame(existingGameId);
            return;
          }
        }
      }

      // No match found, create new game and wait
      console.log(`[2Players] No match found, creating new game and waiting...`);
      const newGameRef = push(ref(database, 'games'));
      const newGameId = newGameRef.key!;
      console.log(`[2Players] Created game ${newGameId}, adding to waiting list`);

      const gameData: GameData = {
        host: playerId.current,
        guest: null,
        gameType,
        state: {},
        status: 'waiting',
        createdAt: Date.now()
      };

      await set(newGameRef, gameData);

      // Add to waiting list
      const myWaitingRef = push(ref(database, `matchmaking/${gameType}`));
      waitingRef.current = myWaitingRef;
      await set(myWaitingRef, {
        playerId: playerId.current,
        gameId: newGameId,
        createdAt: Date.now()
      });

      // Clean up waiting entry on disconnect
      onDisconnect(myWaitingRef).remove();
      onDisconnect(newGameRef).remove();

      setIsHost(true);
      setGameId(newGameId);
      subscribeToGame(newGameId);

    } catch (error) {
      console.error('Error creating game:', error);
      setLastError('Failed to create game');
      setIsMatchmaking(false);
    }
  }, [isMatchmaking]);

  const subscribeToGame = useCallback((gId: string) => {
    console.log(`[2Players] Subscribing to game ${gId}`);
    // Subscribe to game state
    gameRef.current = ref(database, `games/${gId}`);

    onValue(gameRef.current, (snapshot) => {
      if (!snapshot.exists()) {
        // Game was deleted (opponent left)
        setOpponentLeft(true);
        setIsMatchmaking(false);
        return;
      }

      const gameData = snapshot.val() as GameData;

      console.log(`[2Players] Game update:`, gameData);

      // Check if opponent joined (for host)
      if (gameData.status === 'playing' && gameData.guest) {
        console.log(`[2Players] Opponent joined! Game is now playing.`);
        // Remove from waiting list
        if (waitingRef.current) {
          remove(waitingRef.current);
          waitingRef.current = null;
        }

        const elapsed = Date.now() - matchStartTime.current;
        if (elapsed < MIN_MATCHMAKING_TIME) {
          setTimeout(() => {
            setIsMatchmaking(false);
          }, MIN_MATCHMAKING_TIME - elapsed);
        } else {
          setIsMatchmaking(false);
        }
      }

      // Dispatch game state to game components
      if (gameData.state && Object.keys(gameData.state).length > 0) {
        window.dispatchEvent(new CustomEvent('game_state', {
          detail: gameData.state
        }));
      }
    });

    // Subscribe to chat
    chatRef.current = ref(database, `chats/${gId}`);
    onValue(chatRef.current, (snapshot) => {
      if (!snapshot.exists()) return;

      const chatData = snapshot.val();
      const messageList: ChatMessage[] = Object.values(chatData).map((msg: any) => ({
        sender: msg.sender,
        message: msg.message,
        isMe: msg.sender === playerId.current,
        timestamp: msg.timestamp
      }));

      // Sort by timestamp and get only new messages
      messageList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(messageList);
    });

    // Handle our disconnect - notify opponent
    const disconnectRef = ref(database, `games/${gId}/disconnected`);
    onDisconnect(disconnectRef).set(playerId.current);

  }, []);

  const sendGameState = useCallback((state: GameState) => {
    if (!gameId) return;

    const gameStateRef = ref(database, `games/${gameId}/state`);
    set(gameStateRef, state);
  }, [gameId]);

  const sendChat = useCallback((message: string) => {
    if (!gameId) return;

    const chatMsgRef = push(ref(database, `chats/${gameId}`));
    set(chatMsgRef, {
      sender: playerId.current,
      message,
      timestamp: Date.now()
    });
  }, [gameId]);

  const sendFriendRequest = useCallback((targetGameId: string) => {
    // This would integrate with Supabase for friend requests
    console.log('Friend request for game:', targetGameId);
  }, []);

  const leaveGame = useCallback(async () => {
    if (gameId) {
      // Clean up game data
      await remove(ref(database, `games/${gameId}`));
      await remove(ref(database, `chats/${gameId}`));
    }

    if (waitingRef.current) {
      await remove(waitingRef.current);
      waitingRef.current = null;
    }

    if (gameRef.current) {
      off(gameRef.current);
      gameRef.current = null;
    }

    if (chatRef.current) {
      off(chatRef.current);
      chatRef.current = null;
    }

    setGameId('');
    setIsMatchmaking(false);
    setMessages([]);
    setOpponentLeft(false);
  }, [gameId]);

  const reconnect = useCallback(() => {
    // Firebase handles reconnection automatically
    setLastError(null);
  }, []);

  return {
    gameId,
    isHost,
    isConnected,
    isOffline,
    lastError,
    isMatchmaking,
    messages,
    opponentLeft,
    onlinePlayers,
    playerId: playerId.current,
    createGame,
    sendGameState,
    sendChat,
    sendFriendRequest,
    leaveGame,
    reconnect
  };
}

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '../types/game';

const WEBSOCKET_SERVERS = [
  import.meta.env.VITE_WS_URL,
  'wss://2players-io.glitch.me',
  'wss://2players-backup.glitch.me',
  import.meta.env.DEV ? 'ws://localhost:3000/ws' : null
].filter(Boolean) as string[];

interface WebSocketState {
  isConnected: boolean;
  isOffline: boolean;
  lastError: string | null;
  currentServer: string;
}

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isOffline: false,
    lastError: null,
    currentServer: WEBSOCKET_SERVERS[0]
  });
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [opponentCountry, setOpponentCountry] = useState<string | null>(null);
  const [inGame, setInGame] = useState(false);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttempts = useRef(0);
  const serverIndex = useRef(0);
  const maxReconnectAttempts = 2;
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const heartbeatIntervalRef = useRef<number>();

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      window.clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = window.setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.warn('Heartbeat failed, reconnecting...');
          cleanup();
          connect();
        }
      }
    }, 15000);
  }, [cleanup]);

  const tryNextServer = useCallback(() => {
    serverIndex.current = (serverIndex.current + 1) % WEBSOCKET_SERVERS.length;
    reconnectAttempts.current = 0;
    const nextServer = WEBSOCKET_SERVERS[serverIndex.current];
    setState(prev => ({ ...prev, currentServer: nextServer }));
    return nextServer;
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    cleanup();

    try {
      const currentServer = state.currentServer;
      console.log(`Connecting to ${currentServer}...`);
      
      ws.current = new WebSocket(currentServer);
      ws.current.binaryType = 'arraybuffer';

      const connectionTimeout = window.setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          ws.current?.close();
        }
      }, 5000);

      ws.current.onopen = () => {
        clearTimeout(connectionTimeout);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isOffline: false,
          lastError: null
        }));
        startHeartbeat();

        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          if (message && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
          }
        }
      };

      ws.current.onclose = () => {
        clearTimeout(connectionTimeout);
        cleanup();

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 5000);
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        } else {
          const nextServer = tryNextServer();
          if (nextServer === WEBSOCKET_SERVERS[0]) {
            setState({
              isConnected: false,
              isOffline: true,
              lastError: 'Unable to connect to any game server. Playing in offline mode.',
              currentServer: nextServer
            });
          } else {
            connect();
          }
        }
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          if (message.type === 'pong') return;
          if (message.type === 'online_count') {
            setOnlinePlayers(message.data.count);
            return;
          }
          if (message.type === 'game_matched') {
            setInGame(true);
            setOpponentCountry(message.data.opponentCountry);
          }
          if (message.type === 'game_end') {
            setInGame(false);
            setOpponentCountry(null);
          }
          setLastMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('Connection error:', error);
      cleanup();
      const nextServer = tryNextServer();
      if (nextServer === WEBSOCKET_SERVERS[0]) {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isOffline: true,
          lastError: 'Failed to establish connection to any server.'
        }));
      } else {
        connect();
      }
    }
  }, [state.currentServer, cleanup, startHeartbeat, tryNextServer]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (state.isOffline) {
      if (message.type === 'game_state') {
        setLastMessage({
          type: 'game_state_ack',
          data: { ...message.data, offline: true }
        });
      }
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      messageQueueRef.current.push(message);
      connect();
      return;
    }

    try {
      ws.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Send failed:', error);
      messageQueueRef.current.push(message);
      cleanup();
      connect();
    }
  }, [state.isOffline, connect, cleanup]);

  useEffect(() => {
    connect();
    return cleanup;
  }, [connect, cleanup]);

  return {
    isConnected: state.isConnected,
    isOffline: state.isOffline,
    lastError: state.lastError,
    currentServer: state.currentServer,
    onlinePlayers,
    opponentCountry,
    inGame,
    sendMessage,
    lastMessage,
    reconnect: connect
  };
}
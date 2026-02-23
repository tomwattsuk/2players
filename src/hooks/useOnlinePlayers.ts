import { useEffect, useState, useRef } from 'react';
import {
  database,
  ref,
  set,
  onValue,
  off,
  remove,
  onDisconnect
} from '../lib/firebase';

export function useOnlinePlayers() {
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const playerId = useRef<string>(Math.random().toString(36).substring(7));

  useEffect(() => {
    // Check Firebase connection
    const connectedRef = ref(database, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      setIsConnected(connected);

      if (connected) {
        // Mark ourselves as online
        const presenceRef = ref(database, `presence/${playerId.current}`);
        set(presenceRef, { online: true, timestamp: Date.now() });
        onDisconnect(presenceRef).remove();
      }
    });

    // Track online players count
    const allPresenceRef = ref(database, 'presence');
    onValue(allPresenceRef, (snapshot) => {
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      setOnlinePlayers(count);
    });

    return () => {
      off(connectedRef);
      off(allPresenceRef);
      const presenceRef = ref(database, `presence/${playerId.current}`);
      remove(presenceRef);
    };
  }, []);

  return { onlinePlayers, isConnected };
}

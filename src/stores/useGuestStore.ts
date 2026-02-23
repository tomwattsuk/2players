import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CommunicationType = 'video' | 'audio' | 'text';

interface GuestState {
  username: string;
  communicationType: CommunicationType | null;
  hasCompletedSetup: boolean;
  mediaPermissionsGranted: boolean;
  setUsername: (username: string) => void;
  setCommunicationType: (type: CommunicationType) => void;
  setMediaPermissionsGranted: (granted: boolean) => void;
  completeSetup: () => void;
  resetGuest: () => void;
}

const generateGuestName = () => {
  const adjectives = ['Swift', 'Bold', 'Clever', 'Quick', 'Lucky', 'Brave', 'Cool', 'Epic', 'Fierce', 'Great'];
  const nouns = ['Player', 'Gamer', 'Champion', 'Hero', 'Master', 'Legend', 'Star', 'Ace', 'Pro', 'Wizard'];
  const number = Math.floor(Math.random() * 999) + 1;
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}${noun}${number}`;
};

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      username: generateGuestName(),
      communicationType: null,
      hasCompletedSetup: false,
      mediaPermissionsGranted: false,

      setUsername: (username) => set({ username }),

      setCommunicationType: (type) => set({ communicationType: type }),

      setMediaPermissionsGranted: (granted) => set({ mediaPermissionsGranted: granted }),

      completeSetup: () => set({ hasCompletedSetup: true }),

      resetGuest: () => set({
        username: generateGuestName(),
        communicationType: null,
        hasCompletedSetup: false,
        mediaPermissionsGranted: false
      })
    }),
    {
      name: '2players-guest',
    }
  )
);

import { create } from 'zustand';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithTwitter: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  signInWithTwitter: async () => {
    set({ loading: true, error: null });
    try {
      // Mock successful Twitter login
      set({
        user: {
          uid: 'twitter-' + Math.random().toString(36).substr(2, 9),
          email: null,
          displayName: 'Twitter User',
          photoURL: null
        }
      });
    } catch (error) {
      set({ error: 'Failed to sign in with Twitter' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithFacebook: async () => {
    set({ loading: true, error: null });
    try {
      // Mock successful Facebook login
      set({
        user: {
          uid: 'fb-' + Math.random().toString(36).substr(2, 9),
          email: null,
          displayName: 'Facebook User',
          photoURL: null
        }
      });
    } catch (error) {
      set({ error: 'Failed to sign in with Facebook' });
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // Mock email authentication
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      set({
        user: {
          uid: 'email-' + Math.random().toString(36).substr(2, 9),
          email,
          displayName: email.split('@')[0],
          photoURL: null
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    set({ loading: true, error: null });
    try {
      // Mock signup validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (!/^[a-zA-Z0-9_]{6,}$/.test(username)) {
        throw new Error('Invalid username format');
      }
      
      set({
        user: {
          uid: 'email-' + Math.random().toString(36).substr(2, 9),
          email,
          displayName: username,
          photoURL: null
        }
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      set({ user: null, error: null });
    } finally {
      set({ loading: false });
    }
  }
}));
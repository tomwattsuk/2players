import { create } from 'zustand';
import {
  auth, database,
  ref, set as dbSet, get as dbGet, push, update,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  TwitterAuthProvider,
  FacebookAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from '../lib/firebase';

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  allow_messages: boolean;
}

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  username?: string;
  allowMessages?: boolean;
}

interface ProfileUpdate {
  username?: string;
  allowMessages?: boolean;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  profile: Profile | null;
  signInWithTwitter: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  getUserProfile: (userId: string) => Promise<Profile | null>;
  listFriendRequests: (userId: string) => Promise<any[]>;
  sendFriendRequest: (fromUserId: string, toUserId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  storeGameResult: (player1Id: string, player2Id: string, gameType: string, winnerId?: string, isDraw?: boolean) => Promise<void>;
  initializeAuth: () => Promise<void>;
}

async function fetchProfileFromDb(userId: string): Promise<Profile | null> {
  try {
    const snapshot = await dbGet(ref(database,`profiles/${userId}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.val();
    return {
      id: userId,
      username: data.username || '',
      email: data.email || '',
      avatar_url: data.avatarUrl,
      created_at: data.createdAt || new Date().toISOString(),
      allow_messages: data.allowMessages ?? true,
    };
  } catch {
    return null;
  }
}

async function createProfileInDb(uid: string, username: string, email: string, photoURL?: string | null) {
  await dbSet(ref(database, `profiles/${uid}`), {
    username,
    email,
    avatarUrl: photoURL || null,
    allowMessages: true,
    createdAt: new Date().toISOString(),
  });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  profile: null,

  initializeAuth: async () => {
    set({ loading: true });
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await fetchProfileFromDb(firebaseUser.uid);
          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: profile?.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || null,
              photoURL: profile?.avatar_url || firebaseUser.photoURL || null,
              username: profile?.username,
              allowMessages: profile?.allow_messages,
            },
            profile,
            loading: false,
          });
        } else {
          set({ user: null, profile: null, loading: false });
        }
        resolve();
      });
    });
  },

  signInWithTwitter: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, new TwitterAuthProvider());
      let profile = await fetchProfileFromDb(result.user.uid);
      if (!profile) {
        const username = result.user.displayName || result.user.email?.split('@')[0] || 'Player';
        await createProfileInDb(result.user.uid, username, result.user.email || '', result.user.photoURL);
        profile = await fetchProfileFromDb(result.user.uid);
      }
      set({
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: profile?.username || result.user.displayName,
          photoURL: profile?.avatar_url || result.user.photoURL || null,
          username: profile?.username,
          allowMessages: profile?.allow_messages,
        },
        profile,
      });
    } catch (error) {
      set({ error: (error as Error).message || 'Failed to sign in with Twitter' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithFacebook: async () => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, new FacebookAuthProvider());
      let profile = await fetchProfileFromDb(result.user.uid);
      if (!profile) {
        const username = result.user.displayName || result.user.email?.split('@')[0] || 'Player';
        await createProfileInDb(result.user.uid, username, result.user.email || '', result.user.photoURL);
        profile = await fetchProfileFromDb(result.user.uid);
      }
      set({
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: profile?.username || result.user.displayName,
          photoURL: profile?.avatar_url || result.user.photoURL || null,
          username: profile?.username,
          allowMessages: profile?.allow_messages,
        },
        profile,
      });
    } catch (error) {
      set({ error: (error as Error).message || 'Failed to sign in with Facebook' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const profile = await fetchProfileFromDb(result.user.uid);
      set({
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: profile?.username || result.user.email?.split('@')[0] || null,
          photoURL: profile?.avatar_url || null,
          username: profile?.username,
          allowMessages: profile?.allow_messages,
        },
        profile,
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
      if (!/^[a-zA-Z0-9_]{6,}$/.test(username)) {
        throw new Error('Username must be at least 6 alphanumeric characters (underscores allowed)');
      }
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createProfileInDb(result.user.uid, username, email);
      const profile: Profile = {
        id: result.user.uid,
        username,
        email,
        created_at: new Date().toISOString(),
        allow_messages: true,
      };
      set({
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: username,
          photoURL: null,
          username,
          allowMessages: true,
        },
        profile,
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
      await firebaseSignOut(auth);
      set({ user: null, profile: null, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates: ProfileUpdate) => {
    set({ loading: true, error: null });
    try {
      const { user } = get();
      if (!user) throw new Error('No user logged in');
      const updateData: Record<string, unknown> = {};
      if (updates.username) updateData.username = updates.username;
      if (updates.allowMessages !== undefined) updateData.allowMessages = updates.allowMessages;
      if (updates.profilePicture) updateData.avatarUrl = updates.profilePicture;
      await update(ref(database, `profiles/${user.uid}`), updateData);
      set(state => ({
        user: state.user ? {
          ...state.user,
          username: updates.username || state.user.username,
          allowMessages: updates.allowMessages !== undefined ? updates.allowMessages : state.user.allowMessages,
          photoURL: updates.profilePicture || state.user.photoURL,
        } : null,
        profile: state.profile ? {
          ...state.profile,
          username: updates.username || state.profile.username,
          allow_messages: updates.allowMessages !== undefined ? updates.allowMessages : state.profile.allow_messages,
          avatar_url: updates.profilePicture || state.profile.avatar_url,
        } : null,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getUserProfile: async (userId: string): Promise<Profile | null> => {
    return fetchProfileFromDb(userId);
  },

  listFriendRequests: async (userId: string) => {
    try {
      const snapshot = await dbGet(ref(database,`friendships/${userId}/incoming`));
      if (!snapshot.exists()) return [];
      const requests: any[] = [];
      snapshot.forEach((child) => {
        if (child.val().status === 'pending') {
          requests.push({ id: child.key, ...child.val() });
        }
      });
      return requests;
    } catch {
      return [];
    }
  },

  sendFriendRequest: async (fromUserId: string, toUserId: string) => {
    try {
      await dbSet(ref(database, `friendships/${toUserId}/incoming/${fromUserId}`), {
        status: 'pending',
        from: fromUserId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      const { user } = get();
      if (!user) return;
      await update(ref(database, `friendships/${user.uid}/incoming/${requestId}`), { status: 'accepted' });
      await dbSet(ref(database, `friendships/${user.uid}/friends/${requestId}`), true);
      await dbSet(ref(database, `friendships/${requestId}/friends/${user.uid}`), true);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  storeGameResult: async (player1Id: string, player2Id: string, gameType: string, winnerId?: string, isDraw = false) => {
    try {
      await push(ref(database, 'game_results'), {
        player1Id,
        player2Id,
        gameType,
        winnerId: winnerId || null,
        isDraw,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error storing game result:', error);
      throw error;
    }
  },
}));

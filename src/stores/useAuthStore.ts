import { create } from 'zustand';
import { supabase, type Profile } from '../lib/supabase';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  profile: null,

  initializeAuth: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get().getUserProfile(session.user.id);
        set({
          user: {
            uid: session.user.id,
            email: session.user.email ?? null,
            displayName: profile?.username || session.user.email?.split('@')[0] || null,
            photoURL: profile?.avatar_url || null,
            username: profile?.username,
            allowMessages: profile?.allow_messages
          },
          profile
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signInWithTwitter: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter'
      });
      if (error) throw error;
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook'
      });
      if (error) throw error;
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        const profile = await get().getUserProfile(data.user.id);
        set({
          user: {
            uid: data.user.id,
            email: data.user.email ?? null,
            displayName: profile?.username || data.user.email?.split('@')[0] || null,
            photoURL: profile?.avatar_url || null,
            username: profile?.username,
            allowMessages: profile?.allow_messages
          },
          profile
        });
      }
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            username,
            email,
            allow_messages: true
          });

        if (profileError) throw profileError;

        set({
          user: {
            uid: data.user.id,
            email: data.user.email ?? null,
            displayName: username,
            photoURL: null,
            username,
            allowMessages: true
          }
        });
      }
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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

      const updateData: any = {};
      if (updates.username) updateData.username = updates.username;
      if (updates.allowMessages !== undefined) updateData.allow_messages = updates.allowMessages;
      if (updates.profilePicture) updateData.avatar_url = updates.profilePicture;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.uid);

      if (error) throw error;

      set(state => ({
        user: state.user ? { 
          ...state.user, 
          username: updates.username || state.user.username,
          allowMessages: updates.allowMessages !== undefined ? updates.allowMessages : state.user.allowMessages,
          photoURL: updates.profilePicture || state.user.photoURL
        } : null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  getUserProfile: async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  listFriendRequests: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          profiles!friendships_user_id_fkey(username, avatar_url)
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  },

  sendFriendRequest: async (fromUserId: string, toUserId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: fromUserId,
          friend_id: toUserId,
          status: 'pending'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  storeGameResult: async (player1Id: string, player2Id: string, gameType: string, winnerId?: string, isDraw = false) => {
    try {
      const { error } = await supabase
        .from('game_results')
        .insert({
          player1_id: player1Id,
          player2_id: player2Id,
          game_type: gameType,
          winner_id: winnerId,
          is_draw: isDraw
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing game result:', error);
      throw error;
    }
  }
}));

// Listen to auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { getUserProfile } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    const profile = await getUserProfile(session.user.id);
    useAuthStore.setState({
      user: {
        uid: session.user.id,
        email: session.user.email ?? null,
        displayName: profile?.username || session.user.email?.split('@')[0] || null,
        photoURL: profile?.avatar_url || null,
        username: profile?.username,
        allowMessages: profile?.allow_messages
      },
      profile
    });
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({ user: null, profile: null });
  }
});

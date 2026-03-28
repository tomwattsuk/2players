import { useState, useEffect } from 'react';
import { database, ref, get, set as dbSet, update } from '../lib/firebase';
import type { UserProfile, UserStats } from '../types/user';
import { useAuthStore } from '../stores/useAuthStore';

const DEFAULT_STATS: UserStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  rating: 1200,
  gamesPlayed: 0,
  lastPlayed: new Date()
};

export function useProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const snapshot = await get(ref(database, `profiles/${user.uid}`));

        if (snapshot.exists()) {
          const data = snapshot.val();
          setProfile({
            uid: user.uid,
            displayName: data.username || 'Anonymous',
            email: data.email || '',
            photoURL: data.avatarUrl || null,
            stats: DEFAULT_STATS,
            country: null,
            createdAt: new Date(data.createdAt || Date.now()),
            updatedAt: new Date()
          });
        } else {
          // Create new profile
          const newProfile: UserProfile = {
            uid: user.uid,
            displayName: user.displayName || 'Anonymous',
            email: user.email || '',
            photoURL: user.photoURL,
            stats: DEFAULT_STATS,
            country: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await dbSet(ref(database, `profiles/${user.uid}`), {
            username: user.displayName || 'Anonymous',
            email: user.email || '',
            avatarUrl: user.photoURL || null,
            allowMessages: true,
            createdAt: new Date().toISOString(),
          });
          setProfile(newProfile);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const updateData: Record<string, unknown> = {};
      if (updates.displayName) updateData.username = updates.displayName;
      if (updates.photoURL) updateData.avatarUrl = updates.photoURL;

      await update(ref(database, `profiles/${user.uid}`), updateData);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  };

  const updateStats = async (gameResult: 'win' | 'loss' | 'draw') => {
    if (!user || !profile) return;

    const updates: Partial<UserStats> = {
      gamesPlayed: profile.stats.gamesPlayed + 1,
      lastPlayed: new Date()
    };

    switch (gameResult) {
      case 'win':
        updates.wins = profile.stats.wins + 1;
        updates.rating = profile.stats.rating + 25;
        break;
      case 'loss':
        updates.losses = profile.stats.losses + 1;
        updates.rating = Math.max(1000, profile.stats.rating - 25);
        break;
      case 'draw':
        updates.draws = profile.stats.draws + 1;
        break;
    }

    await updateProfile({ stats: { ...profile.stats, ...updates } });
  };

  return { profile, loading, error, updateProfile, updateStats };
}

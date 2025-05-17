
import { create } from 'zustand';
import type { Achievement } from '../types/achievements';

interface AchievementsState {
  achievements: Achievement[];
  unlockedAchievements: string[];
  unlockAchievement: (achievementId: string) => void;
  checkGameAchievements: (gameType: string, isWin: boolean) => void;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first game',
      icon: '🏆'
    },
    {
      id: 'win_streak_3',
      name: 'Hat Trick',
      description: 'Win 3 games in a row',
      icon: '🎯'
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Add 5 friends',
      icon: '🦋'
    }
  ],
  unlockedAchievements: [],
  
  unlockAchievement: (achievementId: string) => {
    set((state) => ({
      unlockedAchievements: [...state.unlockedAchievements, achievementId]
    }));
  },

  checkGameAchievements: (gameType: string, isWin: boolean) => {
    const { achievements, unlockedAchievements, unlockAchievement } = get();
    
    if (isWin && !unlockedAchievements.includes('first_win')) {
      unlockAchievement('first_win');
    }
  }
}));

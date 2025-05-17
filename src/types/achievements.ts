
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
};

export type AchievementProgress = {
  current: number;
  required: number;
};

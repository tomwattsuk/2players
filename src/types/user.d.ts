export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  gamesPlayed: number;
  lastPlayed: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  stats: UserStats;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}
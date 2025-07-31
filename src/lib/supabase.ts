
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dbiuikysjrnzxiguhnsc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiaXVpa3lzanJuenhpZ3VobnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NjQ3MDAsImV4cCI6MjA2OTU0MDcwMH0.O0Wc8Pzf1qJW5P3gw-itj5kYW6pQOaN8pEfBcpsDeWE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  allow_messages: boolean;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface GameResult {
  id: string;
  player1_id: string;
  player2_id: string;
  game_type: string;
  winner_id?: string;
  is_draw: boolean;
  created_at: string;
}

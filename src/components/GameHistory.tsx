import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../lib/supabase';
import { Trophy, Clock, User, Target } from 'lucide-react';

interface GameResult {
  id: string;
  player1_id: string;
  player2_id: string;
  game_type: string;
  winner_id?: string;
  is_draw: boolean;
  created_at: string;
  player1_profile?: { username: string };
  player2_profile?: { username: string };
}

export default function GameHistory() {
  const { user } = useAuthStore();
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGameHistory();
    }
  }, [user]);

  const fetchGameHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_results')
        .select(`
          *,
          player1_profile:profiles!game_results_player1_id_fkey(username),
          player2_profile:profiles!game_results_player2_id_fkey(username)
        `)
        .or(`player1_id.eq.${user.uid},player2_id.eq.${user.uid}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameResult = (game: GameResult) => {
    if (game.is_draw) return 'Draw';
    if (game.winner_id === user?.uid) return 'Win';
    return 'Loss';
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Win': return 'text-green-500';
      case 'Loss': return 'text-red-500';
      case 'Draw': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getOpponentName = (game: GameResult) => {
    if (game.player1_id === user?.uid) {
      return game.player2_profile?.username || 'Unknown Player';
    } else {
      return game.player1_profile?.username || 'Unknown Player';
    }
  };

  const formatGameType = (gameType: string) => {
    return gameType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Games Played</h3>
          <p className="text-gray-400">Your game history will appear here once you start playing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-pink-500" />
        Game History
      </h2>
      
      <div className="space-y-3">
        {games.map((game) => {
          const result = getGameResult(game);
          const opponent = getOpponentName(game);
          
          return (
            <div key={game.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <div className="font-medium">{formatGameType(game.game_type)}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-3 h-3" />
                    vs {opponent}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-semibold ${getResultColor(result)}`}>
                  {result}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(game.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

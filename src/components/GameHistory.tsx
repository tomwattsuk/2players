import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { database, ref, get } from '../lib/firebase';
import { Trophy, Clock, User, Target } from 'lucide-react';

interface GameResult {
  id: string;
  player1Id: string;
  player2Id: string;
  gameType: string;
  winnerId?: string | null;
  isDraw: boolean;
  createdAt: string;
  player1Username?: string;
  player2Username?: string;
}

export default function GameHistory() {
  const { user } = useAuthStore();
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchGameHistory();
  }, [user]);

  const fetchGameHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await get(ref(database, 'game_results'));
      if (!snapshot.exists()) { setGames([]); return; }

      const allResults = Object.entries(snapshot.val()) as [string, any][];
      const mine = allResults
        .filter(([, g]) => g.player1Id === user.uid || g.player2Id === user.uid)
        .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
        .slice(0, 20);

      // Fetch usernames for unique player IDs
      const uids = new Set<string>();
      mine.forEach(([, g]) => { uids.add(g.player1Id); uids.add(g.player2Id); });
      const usernameMap: Record<string, string> = {};
      await Promise.all(Array.from(uids).map(async uid => {
        const s = await get(ref(database, `profiles/${uid}/username`));
        usernameMap[uid] = s.exists() ? s.val() : 'Unknown Player';
      }));

      setGames(mine.map(([id, g]) => ({
        id,
        player1Id: g.player1Id,
        player2Id: g.player2Id,
        gameType: g.gameType,
        winnerId: g.winnerId,
        isDraw: g.isDraw,
        createdAt: g.createdAt,
        player1Username: usernameMap[g.player1Id],
        player2Username: usernameMap[g.player2Id],
      })));
    } catch (error) {
      console.error('Error fetching game history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGameResult = (game: GameResult) => {
    if (game.isDraw) return 'Draw';
    if (game.winnerId === user?.uid) return 'Win';
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
    if (game.player1Id === user?.uid) return game.player2Username || 'Unknown Player';
    return game.player1Username || 'Unknown Player';
  };

  const formatGameType = (gameType: string) =>
    gameType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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
                  <div className="font-medium">{formatGameType(game.gameType)}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-3 h-3" />
                    vs {opponent}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${getResultColor(result)}`}>{result}</div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-3 h-3" />
                  {new Date(game.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { database, ref, get } from '../lib/firebase';
import { User, Mail, Calendar, Trophy, Users } from 'lucide-react';

interface GameStats {
  total_games: number;
  wins: number;
  draws: number;
  losses: number;
}

export default function UserProfile() {
  const { user, profile, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || '');
  const [allowMessages, setAllowMessages] = useState(profile?.allow_messages || false);
  const [gameStats, setGameStats] = useState<GameStats>({
    total_games: 0,
    wins: 0,
    draws: 0,
    losses: 0
  });
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setAllowMessages(profile.allow_messages);
      fetchGameStats();
      fetchFriends();
    }
  }, [profile]);

  const fetchGameStats = async () => {
    if (!user) return;
    try {
      const snapshot = await get(ref(database, 'game_results'));
      if (!snapshot.exists()) return;
      const allResults = Object.values(snapshot.val()) as any[];
      const mine = allResults.filter(g => g.player1Id === user.uid || g.player2Id === user.uid);
      setGameStats({
        total_games: mine.length,
        wins: mine.filter(g => g.winnerId === user.uid).length,
        draws: mine.filter(g => g.isDraw).length,
        losses: mine.filter(g => g.winnerId && g.winnerId !== user.uid && !g.isDraw).length,
      });
    } catch (error) {
      console.error('Error fetching game stats:', error);
    }
  };

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const snapshot = await get(ref(database, `friendships/${user.uid}/friends`));
      if (!snapshot.exists()) { setFriends([]); return; }
      const friendUids = Object.keys(snapshot.val());
      const profiles = await Promise.all(
        friendUids.map(async uid => {
          const s = await get(ref(database, `profiles/${uid}`));
          return s.exists() ? { uid, ...s.val() } : null;
        })
      );
      setFriends(profiles.filter(Boolean));
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ username: username.trim(), allowMessages });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowMessages"
                    checked={allowMessages}
                    onChange={(e) => setAllowMessages(e.target.checked)}
                    className="rounded bg-white/5 border-white/10 text-pink-500 focus:ring-pink-500"
                  />
                  <label htmlFor="allowMessages" className="text-sm text-gray-300">
                    Allow messages from other players
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{profile.username}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 bg-white/10 text-sm rounded-lg hover:bg-white/20 transition"
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="flex items-center gap-4 text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Game Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-500">{gameStats.total_games}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{gameStats.wins}</div>
              <div className="text-sm text-gray-400">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{gameStats.draws}</div>
              <div className="text-sm text-gray-400">Draws</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{gameStats.losses}</div>
              <div className="text-sm text-gray-400">Losses</div>
            </div>
          </div>
          {gameStats.total_games > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-lg font-semibold text-pink-500">
                {Math.round((gameStats.wins / gameStats.total_games) * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Friends ({friends.length})
          </h2>
          {friends.length > 0 ? (
            <div className="space-y-2">
              {friends.slice(0, 5).map((friend, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">{friend.username}</span>
                </div>
              ))}
              {friends.length > 5 && (
                <div className="text-sm text-gray-400 text-center pt-2">
                  And {friends.length - 5} more...
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No friends yet</p>
              <p className="text-sm">Start playing games to meet new people!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

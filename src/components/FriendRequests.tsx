
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { UserPlus, Check, X, User } from 'lucide-react';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url?: string;
  };
}

export default function FriendRequests() {
  const { user, listFriendRequests, acceptFriendRequest } = useAuthStore();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendRequests();
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await listFriendRequests(user.uid);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    // You might want to implement reject functionality in the store
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
        <div className="text-center py-8">
          <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Friend Requests</h3>
          <p className="text-gray-400">You don't have any pending friend requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="w-5 h-5 text-pink-500" />
        Friend Requests ({requests.length})
      </h2>
      
      <div className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium">{request.profiles.username}</div>
                <div className="text-sm text-gray-400">
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id)}
                className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition"
                title="Accept"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(request.id)}
                className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// client/src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { getUserProfile } from '../services/api';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
      }
    };
    fetchProfile();
  }, []);

  if (error) return <div>{error}</div>;
  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p>Username: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <p>Games Played: {profile.gamesPlayed}</p>
      <p>Wins: {profile.wins}</p>
      <p>Losses: {profile.losses}</p>
    </div>
  );
}

export default Profile;
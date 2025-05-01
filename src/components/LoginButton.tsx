import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import AuthModal from './AuthModal';

export default function LoginButton() {
  const [showModal, setShowModal] = useState(false);
  const { user, signOut } = useAuthStore();

  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
      >
        <LogOut className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg hover:opacity-90 transition"
      >
        <User className="w-5 h-5" />
        <span>Sign In</span>
      </button>

      {showModal && (
        <AuthModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
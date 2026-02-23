import { useState } from 'react';
import { User, UserPlus } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import AuthModal from './AuthModal';

export default function LoginButton() {
  const [showModal, setShowModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, signOut } = useAuthStore();

  const handleModalOpen = (signup: boolean) => {
    setIsSignUp(signup);
    setShowModal(true);
  };

  if (user) {
    return (
      <button
        onClick={signOut}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
      >
        <User className="w-5 h-5" />
        <span>Sign Out</span>
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleModalOpen(false)}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
      >
        <User className="w-5 h-5" />
        <span>Log In</span>
      </button>

      <button
        onClick={() => handleModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg hover:opacity-90 transition"
      >
        <UserPlus className="w-5 h-5" />
        <span>Sign Up</span>
      </button>

      {showModal && (
        <AuthModal onClose={() => setShowModal(false)} initialSignUp={isSignUp} />
      )}
    </div>
  );
}

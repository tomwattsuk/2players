
import React, { useState } from 'react';
import { Upload, MessageSquare, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/useAuthStore';

interface OnboardingStepProps {
  currentStep: number;
  stepNumber: number;
  children: React.ReactNode;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({ currentStep, stepNumber, children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: currentStep === stepNumber ? 1 : 0, x: currentStep === stepNumber ? 0 : 20 }}
    className={`${currentStep === stepNumber ? 'block' : 'hidden'}`}
  >
    {children}
  </motion.div>
);

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [allowMessages, setAllowMessages] = useState(true);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { updateProfile } = useAuthStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      await updateProfile({
        username,
        allowMessages,
        profilePicture: previewUrl,
      });
      // Navigate to home or game selection
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="max-w-md w-full p-6 bg-slate-800 rounded-xl shadow-xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome to 2Players!</h2>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`h-2 flex-1 rounded-full ${
                  step >= num ? 'bg-pink-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        <OnboardingStep currentStep={step} stepNumber={1}>
          <h3 className="text-xl font-semibold text-white mb-4">Choose your username</h3>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white mb-4"
            placeholder="Enter username"
            minLength={3}
            maxLength={20}
          />
          <p className="text-slate-400 text-sm mb-4">
            This will be your public identity in games and chat.
          </p>
        </OnboardingStep>

        <OnboardingStep currentStep={step} stepNumber={2}>
          <h3 className="text-xl font-semibold text-white mb-4">Profile Picture</h3>
          <div className="mb-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile preview"
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-slate-700 flex items-center justify-center">
                <Upload className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="profile-upload"
            />
            <label
              htmlFor="profile-upload"
              className="block w-full text-center px-4 py-2 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition"
            >
              Choose Photo
            </label>
          </div>
        </OnboardingStep>

        <OnboardingStep currentStep={step} stepNumber={3}>
          <h3 className="text-xl font-semibold text-white mb-4">Messaging Preferences</h3>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={allowMessages}
              onChange={(e) => setAllowMessages(e.target.checked)}
              className="w-5 h-5 rounded border-slate-400"
            />
            <label className="ml-2 text-white">
              Allow other players to send me messages
            </label>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            You can change this setting later in your profile.
          </p>
        </OnboardingStep>

        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg hover:opacity-90 transition ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 rounded-lg hover:opacity-90 transition ml-auto"
            >
              Complete Setup
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

import { motion, AnimatePresence } from 'framer-motion';

interface AchievementNotificationProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
  };
  onClose?: () => void;
}

export default function AchievementNotification({ achievement }: AchievementNotificationProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 rounded-lg shadow-lg"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{achievement.icon}</span>
          <div>
            <h3 className="font-bold">{achievement.name}</h3>
            <p className="text-sm opacity-90">{achievement.description}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { motion } from 'framer-motion';

interface EffectsProps {
  type: 'splash' | 'explosion' | 'preview';
}

export const CellEffect: React.FC<EffectsProps> = ({ type }) => {
  if (type === 'splash') {
    return (
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: [0.5, 1.2, 1],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-8 h-8 rounded-full bg-blue-400/30 animate-ripple" />
        <div className="absolute w-4 h-4 rounded-full bg-blue-300/40 animate-splash" />
      </motion.div>
    );
  }

  if (type === 'explosion') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.5, 1],
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-full h-full">
          <div className="absolute inset-0 bg-orange-500/30 animate-explode" />
          <div className="absolute inset-0 bg-red-500/30 animate-explode delay-75" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 0.8],
                rotate: [0, 15, -15, 0] 
              }}
              transition={{ duration: 0.3, repeat: 1 }}
              className="w-6 h-6 bg-orange-500/80 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  if (type === 'preview') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-blue-400/20 backdrop-blur-sm"
      />
    );
  }

  return null;
};

export const ShipDamageEffect: React.FC<{ damage: number }> = ({ damage }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-full h-full">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-red-500/40 to-transparent"
          style={{ width: `${damage * 100}%` }}
        />
        {damage > 0.5 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ opacity: [0.4, 0.6] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              className="w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"
            />
          </div>
        )}
      </div>
    </div>
  );
};
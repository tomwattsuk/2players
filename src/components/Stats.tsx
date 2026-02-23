import { Users, Globe2 } from 'lucide-react';

interface StatsProps {
  onlinePlayers: number;
  opponentCountry?: string | null;
  inGame?: boolean;
}

export default function Stats({ onlinePlayers, opponentCountry, inGame = false }: StatsProps) {

  return (
    <div className="flex items-center justify-end gap-4" role="region" aria-label="Game Statistics">
      <div 
        className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-lg rounded-lg px-4 py-2 transition-colors hover:bg-opacity-20"
        aria-live="polite"
      >
        <Users className="w-5 h-5 text-green-400" aria-hidden="true" />
        <span className="text-white font-medium">
          <span className="sr-only">Number of players online: </span>
          <span className="tabular-nums">{onlinePlayers || 0}</span>
          <span className="ml-1">{onlinePlayers === 1 ? 'Player' : 'Players'} Online</span>
        </span>
      </div>
      
      {inGame && opponentCountry && (
        <div 
          className="flex items-center gap-2 bg-white bg-opacity-10 backdrop-blur-lg rounded-lg px-4 py-2 transition-colors hover:bg-opacity-20"
          aria-label={`Opponent from ${opponentCountry}`}
        >
          <Globe2 className="w-5 h-5 text-blue-400" aria-hidden="true" />
          <span className="text-white font-medium">
            Opponent from {opponentCountry}
          </span>
        </div>
      )}
    </div>
  );
}
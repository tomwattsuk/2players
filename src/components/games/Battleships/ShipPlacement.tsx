import React from 'react';
import { Ship as ShipIcon, RotateCw } from 'lucide-react';
import { SHIPS } from './gameLogic';
import type { Ship } from './types';

interface ShipPlacementProps {
  placedShips: Ship[];
  onPlaceShip: (ship: Ship) => void;
  selectedShip: Ship | null;
  onSelectShip: (ship: typeof SHIPS[number]) => void;
  onRotateShip: () => void;
}

const ShipPlacement: React.FC<ShipPlacementProps> = ({ 
  placedShips, 
  selectedShip,
  onSelectShip,
  onRotateShip
}) => {
  const remainingShips = SHIPS.filter(
    ship => !placedShips.find(p => p.name === ship.name)
  );

  if (remainingShips.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-white bg-opacity-5 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Place Your Ships</h3>
        {selectedShip && (
          <button
            onClick={onRotateShip}
            className="px-3 py-1.5 bg-blue-500 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Rotate Ship
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 justify-center">
        {remainingShips.map((ship) => (
          <button
            key={ship.name}
            onClick={() => onSelectShip(ship)}
            className={`
              px-4 py-2 rounded-lg transition flex items-center gap-2
              ${selectedShip?.name === ship.name 
                ? 'bg-blue-600 ring-2 ring-blue-400' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
          >
            <ShipIcon className="w-4 h-4" />
            {ship.name} ({ship.size})
          </button>
        ))}
      </div>
      
      <p className="text-center mt-4 text-sm text-gray-400">
        {selectedShip 
          ? "Click on the grid to place your ship. Use the rotate button to change orientation." 
          : "Select a ship to place on the grid."
        }
      </p>
    </div>
  );
};

export default ShipPlacement;
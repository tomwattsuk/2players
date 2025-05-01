import React from 'react';
import { Ship, Anchor, Navigation, Container, Compass } from 'lucide-react';
import { SHIPS } from './gameLogic';
import type { Ship as ShipType } from './types';

interface ShipListProps {
  placedShips: ShipType[];
  selectedShip: ShipType | null;
  onSelectShip: (ship: typeof SHIPS[number]) => void;
  onRotateShip: () => void;
  isVertical: boolean;
  isLocked: boolean;
}

const SHIP_ICONS = {
  Carrier: Ship,
  Battleship: Container,
  Cruiser: Navigation,
  Submarine: Compass,
  Destroyer: Anchor,
};

const ShipList: React.FC<ShipListProps> = ({ 
  placedShips, 
  selectedShip,
  onSelectShip,
  onRotateShip,
  isVertical,
  isLocked
}) => {
  const handleDragStart = (e: React.DragEvent, ship: typeof SHIPS[number]) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', ship.name);
    onSelectShip(ship);

    // Create a custom drag image that looks like a ship
    const dragImage = document.createElement('div');
    dragImage.className = `
      fixed top-0 left-0 -translate-x-full
      flex ${isVertical ? 'flex-col' : 'flex-row'} gap-0.5
      bg-blue-500/90 backdrop-blur-sm p-1.5 rounded-lg
    `;
    
    for (let i = 0; i < ship.size; i++) {
      const cell = document.createElement('div');
      cell.className = `
        w-8 h-8 bg-blue-400/80 rounded-sm flex items-center justify-center
        ${isVertical 
          ? 'first:rounded-t last:rounded-b' 
          : 'first:rounded-l last:rounded-r'
        }
      `;
      dragImage.appendChild(cell);
    }

    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, isVertical ? 20 : ship.size * 16);
    
    requestAnimationFrame(() => {
      document.body.removeChild(dragImage);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Your Fleet</h3>
        <button
          onClick={onRotateShip}
          disabled={isLocked}
          className={`
            px-3 py-1.5 rounded-lg transition flex items-center gap-2
            ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
            ${isVertical ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'}
          `}
        >
          <div className={`transform transition-transform duration-200 ${isVertical ? 'rotate-90' : ''}`}>
            ⟷
          </div>
          {isVertical ? 'Vertical' : 'Horizontal'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {SHIPS.map((ship) => {
          const isPlaced = placedShips.some(p => p.name === ship.name);
          const isSelected = selectedShip?.name === ship.name;
          const ShipIcon = SHIP_ICONS[ship.name as keyof typeof SHIP_ICONS];
          
          return (
            <div
              key={ship.name}
              draggable={!isPlaced && !isLocked}
              onDragStart={(e) => handleDragStart(e, ship)}
              onClick={() => !isPlaced && !isLocked && onSelectShip(ship)}
              className={`
                p-3 rounded-lg transition-all duration-200
                ${isPlaced || isLocked 
                  ? 'bg-slate-700/50 cursor-not-allowed opacity-50' 
                  : 'bg-blue-500 hover:bg-blue-600 cursor-grab active:cursor-grabbing'
                }
                ${isSelected ? 'ring-2 ring-blue-300' : ''}
                ${!isPlaced && !isLocked ? 'hover:scale-[1.02] hover:shadow-lg' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShipIcon className="w-5 h-5" />
                  <span className="font-medium">{ship.name}</span>
                </div>
                <span className="text-sm opacity-75">{ship.size} units</span>
              </div>

              <div className={`flex ${isVertical ? 'flex-col' : 'flex-row'} gap-0.5`}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    className={`
                      bg-blue-400 flex items-center justify-center
                      ${isVertical 
                        ? 'w-full h-6 first:rounded-t last:rounded-b' 
                        : 'w-6 h-6 first:rounded-l last:rounded-r'
                      }
                    `}
                  >
                    {i === Math.floor(ship.size / 2) && (
                      <ShipIcon className="w-4 h-4 text-blue-900" />
                    )}
                  </div>
                ))}
              </div>

              {isPlaced && (
                <div className="mt-2 text-sm text-center text-blue-200">
                  Ship deployed
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 p-3 bg-blue-900 bg-opacity-30 rounded-lg">
        <p className="text-sm text-blue-200">
          {!selectedShip 
            ? "Drag and drop ships onto the grid or click to select" 
            : "Click on the grid to place the selected ship"
          }
        </p>
      </div>
    </div>
  );
};

export default ShipList;
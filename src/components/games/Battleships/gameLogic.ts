import type { Board } from './types';

export const BOARD_SIZE = 10;

export const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
] as const;

export function initializeBoard(): Board {
  return Array(BOARD_SIZE).fill(null).map(() =>
    Array(BOARD_SIZE).fill(null).map(() => ({
      hasShip: false,
      isHit: false
    }))
  );
}

export function canPlaceShipAt(
  board: Board,
  startX: number,
  startY: number,
  size: number,
  isVertical: boolean
): boolean {
  // Check boundaries
  if (startX < 0 || startX >= BOARD_SIZE || startY < 0 || startY >= BOARD_SIZE) return false;
  if (isVertical && startY + size > BOARD_SIZE) return false;
  if (!isVertical && startX + size > BOARD_SIZE) return false;

  // Check only the cells where the ship will be placed
  for (let i = 0; i < size; i++) {
    const shipX = isVertical ? startX : startX + i;
    const shipY = isVertical ? startY + i : startY;

    // Check if the cell itself is occupied
    if (board[shipY][shipX].hasShip) {
      return false;
    }
  }

  return true;
}
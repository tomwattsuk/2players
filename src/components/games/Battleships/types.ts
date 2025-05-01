export interface Cell {
  hasShip: boolean;
  isHit: boolean;
}

export type Board = Cell[][];

export interface Coordinate {
  x: number;
  y: number;
}

export interface Ship {
  name: string;
  size: number;
  coordinates: Coordinate[];
  isVertical: boolean;
}

export interface GameState {
  type: 'battleships';
  action: 'ready' | 'shot' | 'hit';
  board?: Board;
  coordinate?: Coordinate;
}
export interface GameState {
  type: 'tictactoe' | 'spaceshooter' | 'checkers' | 'battleships' | 'snake' | 'cooppong' | 'wordduel';
  data: any;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
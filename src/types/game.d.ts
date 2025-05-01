export interface GameState {
  type: 'tictactoe' | 'spaceshooter' | 'checkers';
  data: any;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}
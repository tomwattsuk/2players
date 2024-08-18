// client/src/services/socket.js
import io from 'socket.io-client';

const socket = io();

export const joinGame = (gameId) => {
  socket.emit('joinGame', gameId);
};

export const makeMove = (gameId, move) => {
  socket.emit('move', { gameId, move });
};

export const onOpponentMove = (callback) => {
  socket.on('opponentMove', callback);
};

export default socket;
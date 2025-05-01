const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store active games and connections
const games = new Map();
const connections = new Map();
const waitingPlayers = new Map();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    connections: wss.clients.size,
    games: games.size,
    waiting: waitingPlayers.size
  });
});

// Broadcast online count
function broadcastOnlineCount() {
  const count = wss.clients.size;
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'online_count',
        data: { count }
      }));
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(7);
  connections.set(clientId, ws);
  
  // Send initial connection confirmation
  ws.send(JSON.stringify({
    type: 'connection_established',
    data: { clientId }
  }));

  broadcastOnlineCount();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, clientId, data);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  ws.on('close', () => {
    handleDisconnect(clientId);
  });

  ws.on('error', () => {
    handleDisconnect(clientId);
  });
});

function handleDisconnect(clientId) {
  connections.delete(clientId);
  waitingPlayers.delete(clientId);
  
  // Remove from active games and notify opponents
  for (const [gameId, game] of games.entries()) {
    if (game.players.includes(clientId)) {
      const otherPlayers = game.players.filter(id => id !== clientId);
      
      if (otherPlayers.length === 0) {
        games.delete(gameId);
      } else {
        // Notify remaining players
        otherPlayers.forEach(playerId => {
          const ws = connections.get(playerId);
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'player_disconnected',
              data: { clientId }
            }));
          }
        });
      }
    }
  }
  
  broadcastOnlineCount();
}

function handleMessage(ws, clientId, message) {
  const { type, data } = message;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    case 'matchmaking':
      if (!waitingPlayers.has(clientId) && !isPlayerInGame(clientId)) {
        handleMatchmaking(ws, clientId, data);
      }
      break;
      
    case 'game_state':
      handleGameState(ws, clientId, data);
      break;
      
    case 'chat':
      handleChat(ws, clientId, data);
      break;
  }
}

function isPlayerInGame(clientId) {
  for (const game of games.values()) {
    if (game.players.includes(clientId)) {
      return true;
    }
  }
  return false;
}

function handleMatchmaking(ws, clientId, data) {
  const { gameType = 'battleships' } = data;
  
  // Look for waiting players
  for (const [waitingId, waitingData] of waitingPlayers) {
    if (waitingId !== clientId && 
        waitingData.gameType === gameType && 
        !isPlayerInGame(waitingId)) {
      // Match found!
      const gameId = Math.random().toString(36).substring(7);
      
      games.set(gameId, {
        id: gameId,
        players: [waitingId, clientId],
        gameType,
        state: {},
        startTime: Date.now()
      });
      
      // Notify both players
      const waitingWs = connections.get(waitingId);
      if (waitingWs?.readyState === WebSocket.OPEN) {
        waitingWs.send(JSON.stringify({
          type: 'game_matched',
          data: { gameId, isHost: true }
        }));
      }
      
      ws.send(JSON.stringify({
        type: 'game_matched',
        data: { gameId, isHost: false }
      }));
      
      waitingPlayers.delete(waitingId);
      return;
    }
  }
  
  // No match found, add to waiting list
  waitingPlayers.set(clientId, { 
    gameType, 
    timestamp: Date.now() 
  });
  
  ws.send(JSON.stringify({
    type: 'matchmaking_status',
    data: { status: 'waiting' }
  }));
}

function handleGameState(ws, clientId, data) {
  const { gameId } = data;
  const game = games.get(gameId);
  
  if (!game || !game.players.includes(clientId)) return;
  
  // Update game state
  game.state = { ...game.state, ...data };
  
  // Broadcast to other players
  game.players.forEach(playerId => {
    if (playerId !== clientId) {
      const playerWs = connections.get(playerId);
      if (playerWs?.readyState === WebSocket.OPEN) {
        playerWs.send(JSON.stringify({
          type: 'game_state',
          data: game.state
        }));
      }
    }
  });
}

function handleChat(ws, clientId, data) {
  const { gameId, message } = data;
  const game = games.get(gameId);
  
  if (!game || !game.players.includes(clientId)) return;
  
  game.players.forEach(playerId => {
    if (playerId !== clientId) {
      const playerWs = connections.get(playerId);
      if (playerWs?.readyState === WebSocket.OPEN) {
        playerWs.send(JSON.stringify({
          type: 'chat',
          data: { sender: clientId, message }
        }));
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
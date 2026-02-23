const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  path: '/ws'
});

// Store active games and connections
const games = new Map();
const connections = new Map();
const waitingPlayers = new Map(); // gameType -> [{ clientId, ws }]

// Enable CORS and JSON parsing
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for all routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(7);
  connections.set(clientId, { ws, gameId: null });
  console.log(`Client connected: ${clientId}`);

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

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleDisconnect(clientId);
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

function handleMessage(ws, clientId, data) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    case 'matchmaking':
      handleMatchmaking(ws, clientId, data.data);
      break;

    case 'game_state':
      handleGameState(clientId, data.data);
      break;

    case 'chat':
      handleChat(clientId, data.data);
      break;

    case 'friend_request':
      handleFriendRequest(clientId, data.data);
      break;

    default:
      console.log('Unknown message type:', data.type);
  }
}

function handleMatchmaking(ws, clientId, data) {
  const { gameType, action } = data;

  if (action === 'find_match') {
    // Check if there's a waiting player for this game type
    if (!waitingPlayers.has(gameType)) {
      waitingPlayers.set(gameType, []);
    }

    const waiting = waitingPlayers.get(gameType);

    // Remove any stale connections
    const validWaiting = waiting.filter(player => {
      const conn = connections.get(player.clientId);
      return conn && conn.ws.readyState === WebSocket.OPEN;
    });
    waitingPlayers.set(gameType, validWaiting);

    if (validWaiting.length > 0) {
      // Match found!
      const opponent = validWaiting.shift();
      waitingPlayers.set(gameType, validWaiting);

      const gameId = Math.random().toString(36).substring(7);

      // Create game
      games.set(gameId, {
        host: opponent.clientId,
        guest: clientId,
        gameType,
        state: {}
      });

      // Update connections
      const hostConn = connections.get(opponent.clientId);
      const guestConn = connections.get(clientId);

      if (hostConn) hostConn.gameId = gameId;
      if (guestConn) guestConn.gameId = gameId;

      // Notify both players
      opponent.ws.send(JSON.stringify({
        type: 'game_matched',
        data: { gameId, isHost: true, opponentId: clientId }
      }));

      ws.send(JSON.stringify({
        type: 'game_matched',
        data: { gameId, isHost: false, opponentId: opponent.clientId }
      }));

      console.log(`Game matched: ${gameId} (${gameType})`);
    } else {
      // No match found, add to waiting list
      waitingPlayers.get(gameType).push({ clientId, ws });

      ws.send(JSON.stringify({
        type: 'matchmaking_status',
        data: { status: 'waiting', gameType }
      }));

      console.log(`Player ${clientId} waiting for ${gameType} match`);
    }
  } else if (action === 'cancel') {
    // Remove from waiting list
    if (waitingPlayers.has(gameType)) {
      const waiting = waitingPlayers.get(gameType);
      waitingPlayers.set(gameType, waiting.filter(p => p.clientId !== clientId));
    }
  }
}

function handleGameState(clientId, data) {
  const conn = connections.get(clientId);
  if (!conn || !conn.gameId) return;

  const game = games.get(conn.gameId);
  if (!game) return;

  // Forward game state to opponent
  const opponentId = game.host === clientId ? game.guest : game.host;
  const opponentConn = connections.get(opponentId);

  if (opponentConn && opponentConn.ws.readyState === WebSocket.OPEN) {
    opponentConn.ws.send(JSON.stringify({
      type: 'game_state',
      data
    }));
  }
}

function handleChat(clientId, data) {
  const conn = connections.get(clientId);
  if (!conn || !conn.gameId) return;

  const game = games.get(conn.gameId);
  if (!game) return;

  // Forward chat to opponent
  const opponentId = game.host === clientId ? game.guest : game.host;
  const opponentConn = connections.get(opponentId);

  if (opponentConn && opponentConn.ws.readyState === WebSocket.OPEN) {
    opponentConn.ws.send(JSON.stringify({
      type: 'chat',
      data: {
        sender: clientId,
        message: data.message
      }
    }));
  }
}

function handleFriendRequest(clientId, data) {
  // This would typically integrate with a database
  console.log(`Friend request from ${clientId}:`, data);
}

function handleDisconnect(clientId) {
  const conn = connections.get(clientId);

  if (conn && conn.gameId) {
    const game = games.get(conn.gameId);
    if (game) {
      // Notify opponent of disconnection
      const opponentId = game.host === clientId ? game.guest : game.host;
      const opponentConn = connections.get(opponentId);

      if (opponentConn && opponentConn.ws.readyState === WebSocket.OPEN) {
        opponentConn.ws.send(JSON.stringify({
          type: 'player_disconnected',
          data: { playerId: clientId }
        }));
      }

      // Clean up game
      games.delete(conn.gameId);
    }
  }

  // Remove from waiting players
  waitingPlayers.forEach((waiting, gameType) => {
    waitingPlayers.set(gameType, waiting.filter(p => p.clientId !== clientId));
  });

  connections.delete(clientId);
  console.log(`Client disconnected: ${clientId}`);
  broadcastOnlineCount();
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

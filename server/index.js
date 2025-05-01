const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  path: '/ws' // Add explicit WebSocket path
});

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

// Root endpoint for health check
app.get('/', (req, res) => {
  res.send('WebSocket Game Server - Online');
});

// Health check endpoint
app.get('/health', (req, res) => {
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

// Rest of the server code remains the same...

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
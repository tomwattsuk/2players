
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

const userController = require('./controllers/userController');

// User registration endpoint
app.post('/api/users', async (req, res) => {
  try {
    const result = await userController.createUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// User update endpoint
app.put('/api/users/:uid', async (req, res) => {
  try {
    const result = await userController.updateUser(req.params.uid, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Serve index.html for all routes to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// WebSocket connection handling
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
  // Handle different message types
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    // Add other message handlers as needed
  }
}

function handleDisconnect(clientId) {
  connections.delete(clientId);
  waitingPlayers.delete(clientId);
  console.log(`Client disconnected: ${clientId}`);
  broadcastOnlineCount();
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

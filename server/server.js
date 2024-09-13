const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log(err));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/games', require('./routes/games'));
app.use('/api/matches', require('./routes/matches'));

// At the end of the file
module.exports = app;

// Game seeding
const Game = require('./models/Game');

const seedGames = async () => {
  const games = [
    { name: 'Tic-Tac-Toe', description: 'Classic 3x3 grid game' },
    { name: 'Connect Four', description: 'Vertical 6x7 grid game' }
  ];

  for (let game of games) {
    try {
      await Game.findOneAndUpdate({ name: game.name }, game, { upsert: true, new: true });
      console.log(`${game.name} added/updated`);
    } catch (error) {
      console.error(`Error adding/updating ${game.name}:`, error);
    }
  }
};

seedGames();

// Socket.IO
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
    console.log(`User joined game: ${gameId}`);
  });

  socket.on('move', ({ gameId, move }) => {
    socket.to(gameId).emit('opponentMove', move);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));
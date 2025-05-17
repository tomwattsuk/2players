
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// User table creation
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        uid VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100),
        photo_url TEXT,
        allow_messages BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS user_stats (
        uid VARCHAR(255) PRIMARY KEY REFERENCES users(uid),
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        rating INTEGER DEFAULT 1000,
        games_played INTEGER DEFAULT 0,
        last_played TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
      );
    `);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

createTables();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

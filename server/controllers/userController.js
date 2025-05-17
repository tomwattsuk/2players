
const db = require('../db');

const createUser = async (userData) => {
  const { uid, email, username, displayName, photoURL, allowMessages } = userData;
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert user
    await client.query(
      `INSERT INTO users (uid, email, username, display_name, photo_url, allow_messages)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uid, email, username, displayName, photoURL, allowMessages]
    );
    
    // Initialize stats
    await client.query(
      `INSERT INTO user_stats (uid) VALUES ($1)`,
      [uid]
    );
    
    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateUser = async (uid, updates) => {
  const { username, displayName, photoURL, allowMessages } = updates;
  
  const result = await db.query(
    `UPDATE users 
     SET username = COALESCE($1, username),
         display_name = COALESCE($2, display_name),
         photo_url = COALESCE($3, photo_url),
         allow_messages = COALESCE($4, allow_messages),
         updated_at = CURRENT_TIMESTAMP
     WHERE uid = $5
     RETURNING *`,
    [username, displayName, photoURL, allowMessages, uid]
  );
  
  return result.rows[0];
};

module.exports = {
  createUser,
  updateUser
};

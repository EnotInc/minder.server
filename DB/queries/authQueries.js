const pool = require("../index");

async function userExists(email, username) {
  return pool.query(
    `SELECT 1 FROM users WHERE email = $1 OR username = $2`,
    [email, username]
  );
}

async function createUser({ username, email, password_hash }) {
  return pool.query(
    `INSERT INTO users (username, email, password_hash, email_verified, is_active)
     VALUES ($1, $2, $3, FALSE, TRUE)
     RETURNING id, email`,
    [username, email, password_hash]
  );
}

async function findUserByEmail(email) {
  return pool.query(
    `SELECT id, email, password_hash, is_active
     FROM users
     WHERE email = $1`,
    [email]
  );
}

async function saveDevice(user_id, fcmToken) {
  if (!fcmToken) {
    return { rowCount: 0, rows: [] };
  }

  return pool.query(
    `INSERT INTO user_devices (user_id, fcm_token, platform, is_active, created_at, last_seen_at)
     VALUES ($1, $2, 'android', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (fcm_token)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       is_active = TRUE,
       last_seen_at = CURRENT_TIMESTAMP
     RETURNING id, user_id, fcm_token, is_active`,
    [user_id, fcmToken]
  );
}

async function getFcmToken(user_id) {
  return pool.query(
    `SELECT fcm_token
     FROM user_devices
     WHERE user_id = $1 AND is_active = TRUE`,
    [user_id]
  );
}

module.exports = {
  userExists,
  createUser,
  findUserByEmail,
  saveDevice,
  getFcmToken,
};
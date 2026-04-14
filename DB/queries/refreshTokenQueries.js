const pool = require("../index");

async function insertRefreshToken(userId, tokenHash, expiresAt) {
  return pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

async function findRefreshToken(tokenHash) {
  return pool.query(
    `SELECT id, user_id, revoked_at, expires_at
     FROM refresh_tokens
     WHERE token_hash = $1`,
    [tokenHash]
  );
}

async function revokeRefreshToken(id, replacedByHash) {
  return pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP,
         replaced_by_token_hash = $1
     WHERE id = $2`,
    [replacedByHash || null, id]
  );
}

async function logoutRefreshToken(tokenHash) {
  return pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE token_hash = $1 AND revoked_at IS NULL
     RETURNING id, user_id`,
    [tokenHash]
  );
}

async function deactivateUserDevices(user_id) {
  return pool.query(
    `UPDATE user_devices
     SET is_active = FALSE
     WHERE user_id = $1`,
    [user_id]
  );
}

module.exports = {
  insertRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  logoutRefreshToken,
  deactivateUserDevices,
};
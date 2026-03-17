const pool = require("../index");

async function userExists(email, username) {
  return pool.query(
    `SELECT 1 FROM users WHERE email=$1 OR username=$2`,
    [email, username]
  );
}

async function createUser({ username, email, password_hash }) {
  return pool.query(
    `INSERT INTO users (username, email, password_hash, email_verified, is_active)
     VALUES ($1,$2,$3,FALSE,TRUE)
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

// TODO: refactor
async function creadeDevice(user_id, fcmToken) {
  return pool.query(
    ` INSERT INTO user_devices (user_id, fcm_token, platform)
      VALUES ($1, $2, 'android')`,
      [user_id, fcmToken]
  )
}

// TODO: refactor
async function updateDevice(user_id, fcmToken) {
  return pool.query(
    ` UPDATE user_devices
      SET fcm_token = $2
      WHERE user_id = $1`,
      [user_id, fcmToken]
  )
}

async function getFcmToken(user_id){
  return pool.query(
    `SELECT fcm_token
     FROM user_devices
     WHERE user_id = $1`,
    [user_id] 
  )
}

module.exports = { userExists, createUser, findUserByEmail, creadeDevice, updateDevice, getFcmToken };
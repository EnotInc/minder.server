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

module.exports = { userExists, createUser, findUserByEmail };
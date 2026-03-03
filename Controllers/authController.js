const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../DB");
const { ok, fail } = require("../services/response");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return fail(res, 400, "username, email, password are required");

    const exists = await pool.query(
      "SELECT 1 FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (exists.rowCount > 0) return fail(res, 409, "User already exists");

    const hash = await bcrypt.hash(password, 10);

    const created = await pool.query(
      `INSERT INTO users (username, email, password_hash, email_verified, is_active)
       VALUES ($1, $2, $3, FALSE, TRUE)
       RETURNING id, email`,
      [username, email, hash]
    );

    const token = signToken(created.rows[0]);
    return ok(res, "Registered", { token });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 400, "email and password are required");

    const userRes = await pool.query(
      "SELECT id, email, password_hash, is_active FROM users WHERE email = $1",
      [email]
    );
    if (userRes.rowCount === 0) return fail(res, 401, "Invalid credentials");

    const user = userRes.rows[0];
    if (!user.is_active) return fail(res, 403, "User is inactive");

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return fail(res, 401, "Invalid credentials");

    const token = signToken(user);
    return ok(res, "Logged in", { token });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

exports.me = async (req, res) => {
  // req.user положил middleware/auth.js после проверки JWT
  return ok(res, "Me", { user: req.user });
};
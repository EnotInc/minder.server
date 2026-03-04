const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function calcRefreshExpiresAt() {
  const days = Number(process.env.JWT_REFRESH_DAYS || 7);
  const d = new Date();
  d.setDate(d.getDate() + (Number.isFinite(days) ? days : 7));
  return d;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  calcRefreshExpiresAt,
};
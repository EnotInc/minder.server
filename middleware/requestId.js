const crypto = require("crypto");

module.exports = function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming.trim()) ? incoming.trim() : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("X-Request-Id", id);

  next();
};
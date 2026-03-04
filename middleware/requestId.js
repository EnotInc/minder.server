const crypto = require("crypto");

module.exports = function requestId(req, res, next) {
  // если пришёл X-Request-Id от клиента — используем его
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming.trim()) ? incoming.trim() : crypto.randomUUID();

  req.requestId = id;
  res.setHeader("X-Request-Id", id);

  next();
};
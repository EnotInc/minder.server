const logger = require("../services/logger");

function sanitizeBody(body) {
  if (!body || typeof body !== "object") return undefined;

  const copy = Array.isArray(body) ? body.slice(0, 20) : { ...body };

  const maskKeys = ["password", "password_hash", "refresh_token", "access_token", "token"];
  for (const k of maskKeys) {
    if (copy && typeof copy === "object" && k in copy) copy[k] = "[REDACTED]";
  }

  if (copy.note && typeof copy.note === "object") {
    if ("password" in copy.note) copy.note.password = "[REDACTED]";
    if ("token" in copy.note) copy.note.token = "[REDACTED]";
  }
  if (copy.notification && typeof copy.notification === "object") {
    if ("token" in copy.notification) copy.notification.token = "[REDACTED]";
  }

  return copy;
}

module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;

    const meta = {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Math.round(ms * 100) / 100,
      userId: req.user?.userId,
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
      ua: req.headers["user-agent"],
    };

    const shouldLogBody =
      req.method !== "GET" &&
      (res.statusCode >= 400 || req.originalUrl.startsWith("/apiv1/auth"));

    if (shouldLogBody) meta.body = sanitizeBody(req.body);

    if (res.statusCode >= 500) logger.error("request", new Error("HTTP 5xx"), meta);
    else if (res.statusCode >= 400) logger.warn("request", meta);
    else logger.info("request", meta);
  });

  next();
};
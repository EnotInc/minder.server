const jwt = require("jsonwebtoken");
const { fail } = require("../utils/response");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) return fail(res, 401, "Missing Bearer token");

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return fail(res, 401, "Invalid token");
  }
};
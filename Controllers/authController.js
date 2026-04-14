const bcrypt = require("bcrypt");
const { ok, failSoft, fail } = require("../services/response");
const logger = require("../services/logger");

const authQ = require("../DB/queries/authQueries");
const rtQ = require("../DB/queries/refreshTokenQueries");

const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  calcRefreshExpiresAt,
} = require("../services/tokens");

exports.me = async (req, res) => ok(res, "Me", { user: req.user });

exports.register = async (req, res) => {
  try {
    const { username, email, password, fcmToken } = req.body || {};

    if (!username || !email || !password) {
      return failSoft(res, "username, email, password are required");
    }

    const exists = await authQ.userExists(email, username);
    if (exists.rowCount > 0) {
      return failSoft(res, "User already exists");
    }

    const password_hash = await bcrypt.hash(password, 10);
    const created = await authQ.createUser({ username, email, password_hash });
    const user = created.rows[0];

    await authQ.saveDevice(user.id, fcmToken);

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id });

    await rtQ.insertRefreshToken(
      user.id,
      hashToken(refreshToken),
      calcRefreshExpiresAt()
    );

    logger.info("auth.register", { requestId: req.requestId, userId: user.id });

    return ok(res, "Registered", {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (e) {
    logger.error("auth.register failed", e, { requestId: req.requestId });
    return fail(res, 500, "Server error");
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body || {};

    if (!email || !password) {
      return failSoft(res, "email and password are required");
    }

    const userRes = await authQ.findUserByEmail(email);
    if (userRes.rowCount === 0) {
      return failSoft(res, "Invalid credentials");
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return failSoft(res, "User is inactive");
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return failSoft(res, "Invalid credentials");
    }

    await authQ.saveDevice(user.id, fcmToken);

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id });

    await rtQ.insertRefreshToken(
      user.id,
      hashToken(refreshToken),
      calcRefreshExpiresAt()
    );

    logger.info("auth.login", { requestId: req.requestId, userId: user.id });

    return ok(res, "Logged in", {
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (e) {
    logger.error("auth.login failed", e, { requestId: req.requestId });
    return fail(res, 500, "Server error");
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return failSoft(res, "refresh_token is required");
    }

    let payload;
    try {
      payload = verifyRefreshToken(refresh_token);
    } catch {
      return failSoft(res, "Invalid refresh token");
    }

    const oldHash = hashToken(refresh_token);
    const existing = await rtQ.findRefreshToken(oldHash);

    if (existing.rowCount === 0) {
      return failSoft(res, "Refresh token not found");
    }

    const row = existing.rows[0];

    if (row.revoked_at) {
      return failSoft(res, "Refresh token revoked");
    }

    if (new Date(row.expires_at) < new Date()) {
      return failSoft(res, "Refresh token expired");
    }

    const newAccessToken = signAccessToken({ userId: payload.userId });
    const newRefreshToken = signRefreshToken({ userId: payload.userId });
    const newHash = hashToken(newRefreshToken);

    await rtQ.revokeRefreshToken(row.id, newHash);
    await rtQ.insertRefreshToken(
      payload.userId,
      newHash,
      calcRefreshExpiresAt()
    );

    logger.info("auth.refresh", {
      requestId: req.requestId,
      userId: payload.userId,
    });

    return ok(res, "Token refreshed", {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (e) {
    logger.error("auth.refresh failed", e, { requestId: req.requestId });
    return fail(res, 500, "Server error");
  }
};

exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return failSoft(res, "refresh_token is required");
    }

    const tokenHash = hashToken(refresh_token);
    const logout = await rtQ.logoutRefreshToken(tokenHash);

    if (logout.rowCount > 0) {
      const user_id = logout.rows[0].user_id;
      await rtQ.deactivateUserDevices(user_id);
    }

    logger.info("auth.logout", { requestId: req.requestId });

    return ok(res, "Logged out");
  } catch (e) {
    logger.error("auth.logout failed", e, { requestId: req.requestId });
    return fail(res, 500, "Server error");
  }
};
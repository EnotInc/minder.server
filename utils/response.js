function ok(res, message, data = {}) {
  return res.json({ success: true, message, data });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

module.exports = { ok, fail };
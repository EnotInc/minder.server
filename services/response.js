function ok(res, message, data = {}) {
  const requestId = res.req?.requestId;
  return res.json({ success: true, message, data, requestId });
}

function fail(res, status, message) {
  const requestId = res.req?.requestId;
  return res.status(status).json({ success: false, message, requestId });
}

module.exports = { ok, fail };
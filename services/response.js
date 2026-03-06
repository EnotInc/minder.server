function ok(res, message, data = {}) {
  res.locals.success = true;
  return res.json({ success: true, message, data, requestId: res.req?.requestId });
}

function failSoft(res, message, data = {}) {
  res.locals.success = false;
  return res.status(200).json({ success: false, message, data, requestId: res.req?.requestId });
}

function fail(res, status, message) {
  res.locals.success = false;
  return res.status(status).json({ success: false, message, requestId: res.req?.requestId });
}

module.exports = { ok, failSoft, fail };
const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return '"[unserializable]"';
  }
}

function ensureDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // молча
  }
}

function writeLine(line) {
  try {
    ensureDir();
    fs.appendFileSync(LOG_FILE, line + "\n", { encoding: "utf8" });
  } catch {
    // молча: логгер не должен валить приложение
  }
}

function log(level, message, meta = {}) {
  const entry = { ts: new Date().toISOString(), level, message, meta };
  writeLine(safeJson(entry));
}

function info(message, meta) {
  try { log("info", message, meta); } catch {}
}

function warn(message, meta) {
  try { log("warn", message, meta); } catch {}
}

function error(message, err, meta = {}) {
  try {
    log("error", message, {
      ...meta,
      error: { name: err?.name, message: err?.message, stack: err?.stack },
    });
  } catch {}
  // fallback в консоль — тоже в try/catch
  try { console.error(message, err); } catch {}
}

module.exports = { info, warn, error };
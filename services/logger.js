const fs = require("fs");
const path = require("path");


let pool = null;
try {
  pool = require("../DB"); 
} catch {
  pool = null;
}

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
    
  }
}

function writeLine(line) {
  try {
    ensureDir();
    fs.appendFileSync(LOG_FILE, line + "\n", { encoding: "utf8" });
  } catch {
    
  }
}


function writeDb(entry) {
  try {
    if (!pool) return;

    const meta = entry.meta ?? {};
    const q = `
      INSERT INTO app_logs (ts, level, message, request_id, user_id, method, path, status, ms, meta)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    `;

    const params = [
      entry.ts ? new Date(entry.ts) : new Date(),
      entry.level || "info",
      entry.message || "",
      meta.requestId || null,
      meta.userId || null,
      meta.method || null,
      meta.path || null,
      meta.status ?? null,
      meta.ms ?? null,
      JSON.stringify(meta),
    ];

    
    Promise.resolve(pool.query(q, params)).catch(() => {});
  } catch {
    
  }
}

function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta,
  };

  
  try {
    writeLine(safeJson(entry));
  } catch {}

  
  writeDb(entry);
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

  
  try { console.error(message, err); } catch {}
}

module.exports = { info, warn, error };
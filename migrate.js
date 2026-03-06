const fs = require("fs");
const path = require("path");
const pool = require("./DB"); 

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getApplied(client) {
  const res = await client.query(`SELECT filename FROM schema_migrations`);
  return new Set(res.rows.map(r => r.filename));
}

async function applyOne(client, file, sql) {
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`INSERT INTO schema_migrations(filename) VALUES ($1)`, [file]);
    await client.query("COMMIT");
    console.log(`✅ Applied ${file}`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`❌ Failed ${file}`);
    throw e;
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);

    const applied = await getApplied(client);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`↩️ Skipped ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8").trim();
      if (!sql) {
        console.log(`⚠️ Empty ${file} - skipped`);
        continue;
      }
      await applyOne(client, file, sql);
    }

    console.log("🎉 Migrations done");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
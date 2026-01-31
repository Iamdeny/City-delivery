/**
 * Simple migration runner for Postgres.
 *
 * Applies SQL files from backend/src/database/migrations in lexicographic order
 * and stores applied filenames in public.schema_migrations.
 *
 * This avoids re-applying full schema.sql (which may contain non-idempotent DDL).
 */
const fs = require('fs');
const path = require('path');

const { getClient } = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles() {
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.sql'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
  return files;
}

function readMigrationSql(filename) {
  const full = path.join(MIGRATIONS_DIR, filename);
  return fs.readFileSync(full, 'utf8');
}

async function getAppliedSet(client) {
  const res = await client.query(`SELECT filename FROM schema_migrations`);
  return new Set(res.rows.map((r) => String(r.filename)));
}

async function ensureCriticalTables(client) {
  const names = ['order_returns', 'order_return_items', 'audit_events'];
  const res = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [names]
  );
  const found = new Set(res.rows.map((r) => r.table_name));
  const missing = names.filter((n) => !found.has(n));
  return { found: Array.from(found), missing };
}

async function main() {
  const client = await getClient();
  try {
    await ensureMigrationsTable(client);

    const files = await listMigrationFiles();
    if (!files.length) {
      console.log('ℹ️ No migrations found.');
      return;
    }

    const applied = await getAppliedSet(client);
    const pending = files.filter((f) => !applied.has(f));

    if (!pending.length) {
      console.log('✅ No pending migrations.');
      const check = await ensureCriticalTables(client);
      if (check.missing.length) {
        console.warn('⚠️ Critical tables missing:', check.missing);
        process.exitCode = 2;
      }
      return;
    }

    console.log(`🧱 Applying ${pending.length} migration(s)...`);

    for (const filename of pending) {
      const sql = readMigrationSql(filename);
      console.log(`→ ${filename}`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations(filename) VALUES ($1)`, [filename]);
      await client.query('COMMIT');
    }

    const check = await ensureCriticalTables(client);
    if (check.missing.length) {
      console.warn('⚠️ Migrations finished but some critical tables are missing:', check.missing);
      process.exitCode = 2;
      return;
    }
    console.log('✅ Migrations OK. Critical tables present:', check.found.join(', '));
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('❌ Migration failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main();


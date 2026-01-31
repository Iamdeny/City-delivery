/**
 * AuditRepository (Postgres)
 * Stores immutable audit events for Ops.
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function clampInt(n, { min, max, fallback }) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.floor(v);
  return Math.max(min, Math.min(max, i));
}

function createAuditRepositoryPg() {
  async function ensureTables() {
    // Keep runtime migration safe for dev environments
    await query(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        actor_user_id INTEGER,
        actor_role TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        ip INET,
        user_agent TEXT,
        meta JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor_user_id);`);
  }

  return {
    async append(event) {
      return metrics.timeOp('audit.append', async () => {
        await ensureTables();
        const e = event || {};
        const meta = e.meta && typeof e.meta === 'object' ? e.meta : {};
        const res = await query(
          `INSERT INTO audit_events
            (actor_user_id, actor_role, action, entity_type, entity_id, ip, user_agent, meta)
           VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
           RETURNING id, created_at`,
          [
            e.actor_user_id ?? null,
            e.actor_role ?? null,
            String(e.action || ''),
            String(e.entity_type || ''),
            e.entity_id !== undefined && e.entity_id !== null ? String(e.entity_id) : null,
            e.ip ?? null,
            e.user_agent ?? null,
            JSON.stringify(meta),
          ]
        );
        return res.rows[0];
      });
    },

    async list(params = {}) {
      return metrics.timeOp('audit.list', async () => {
        await ensureTables();
        const limit = clampInt(params.limit, { min: 1, max: 200, fallback: 50 });
        const offset = clampInt(params.offset, { min: 0, max: 100000, fallback: 0 });

        const where = [];
        const values = [];
        let i = 1;

        if (params.action) {
          where.push(`action = $${i}`);
          values.push(String(params.action));
          i += 1;
        }
        if (params.entityType) {
          where.push(`entity_type = $${i}`);
          values.push(String(params.entityType));
          i += 1;
        }
        if (params.entityId) {
          where.push(`entity_id = $${i}`);
          values.push(String(params.entityId));
          i += 1;
        }
        if (params.actorId) {
          const actorId = Number(params.actorId);
          if (Number.isFinite(actorId) && actorId > 0) {
            where.push(`actor_user_id = $${i}`);
            values.push(Math.floor(actorId));
            i += 1;
          }
        }
        if (params.q) {
          const q = String(params.q || '').trim();
          if (q) {
            where.push(`(
              action ILIKE $${i}
              OR entity_type ILIKE $${i}
              OR COALESCE(entity_id,'') ILIKE $${i}
              OR COALESCE(actor_role,'') ILIKE $${i}
              OR COALESCE(actor_user_id::text,'') ILIKE $${i}
            )`);
            values.push(`%${q}%`);
            i += 1;
          }
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const countRes = await query(`SELECT COUNT(*)::int AS count FROM audit_events ${whereSql}`, values);
        const total = countRes.rows[0]?.count ?? 0;

        const listRes = await query(
          `SELECT
            id,
            created_at,
            actor_user_id,
            actor_role,
            action,
            entity_type,
            entity_id,
            ip,
            user_agent,
            meta
           FROM audit_events
           ${whereSql}
           ORDER BY id DESC
           LIMIT ${limit} OFFSET ${offset}`,
          values
        );

        return {
          total,
          limit,
          offset,
          events: listRes.rows,
        };
      });
    },
  };
}

module.exports = { createAuditRepositoryPg };


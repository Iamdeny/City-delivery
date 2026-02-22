/**
 * UserRepository (Postgres) - read model for admin ops.
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function clampInt(n, { min, max, fallback }) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.floor(v);
  return Math.max(min, Math.min(max, i));
}

function createUserRepositoryPg() {
  return {
    async getById(userId) {
      return metrics.timeOp('users.admin.getById', async () => {
        const res = await query(
          `SELECT id, email, name, phone, role, is_active, created_at
           FROM users
           WHERE id = $1`,
          [userId]
        );
        return res.rows[0] || null;
      });
    },

    /**
     * @param {{ q?:string, role?:string, isActive?:boolean, limit?:number, offset?:number }} params
     */
    async list(params = {}) {
      return metrics.timeOp('users.admin.list', async () => {
        const limit = clampInt(params.limit, { min: 1, max: 200, fallback: 50 });
        const offset = clampInt(params.offset, { min: 0, max: 100000, fallback: 0 });

        const where = [];
        const values = [];
        let i = 1;

        if (params.q) {
          where.push(`(u.email ILIKE $${i} OR u.name ILIKE $${i})`);
          values.push(`%${String(params.q)}%`);
          i += 1;
        }

        if (params.role) {
          where.push(`u.role = $${i}`);
          values.push(String(params.role));
          i += 1;
        }

        if (params.isActive !== undefined) {
          where.push(`u.is_active = $${i}`);
          values.push(Boolean(params.isActive));
          i += 1;
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const countRes = await query(`SELECT COUNT(*)::int AS count FROM users u ${whereSql}`, values);
        const total = countRes.rows[0]?.count ?? 0;

        const listSql = `
          SELECT
            u.id,
            u.email,
            u.name,
            u.phone,
            u.role,
            u.is_active,
            u.created_at
          FROM users u
          ${whereSql}
          ORDER BY u.id DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const listRes = await query(listSql, values);

        return {
          total,
          limit,
          offset,
          users: listRes.rows,
        };
      });
    },

    /**
     * Admin update: role and/or is_active
     * @param {number} userId
     * @param {{ role?:string, is_active?:boolean }} patch
     */
    async updateAdmin(userId, patch) {
      return metrics.timeOp('users.admin.update', async () => {
        const sets = [];
        const values = [];
        let i = 1;

        if (patch.role !== undefined) {
          sets.push(`role = $${i}`);
          values.push(patch.role);
          i += 1;
        }
        if (patch.is_active !== undefined) {
          sets.push(`is_active = $${i}`);
          values.push(patch.is_active);
          i += 1;
        }

        // always touch updated fields
        sets.push(`updated_at = NOW()`);

        values.push(userId);
        const idIdx = i;

        const sql = `
          UPDATE users
          SET ${sets.join(', ')}
          WHERE id = $${idIdx}
          RETURNING id, email, name, phone, role, is_active, created_at
        `;
        const res = await query(sql, values);
        return res.rows[0];
      });
    },
  };
}

module.exports = { createUserRepositoryPg };


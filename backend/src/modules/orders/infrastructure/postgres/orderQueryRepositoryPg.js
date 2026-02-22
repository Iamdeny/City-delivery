/**
 * OrderQueryRepository (Postgres)
 * Read-model queries for Ops UI (orders by store).
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

const ACTIVE_STATUSES = new Set([
  'pending',
  'preparing',
  'picking',
  'ready',
  'assigned_to_courier',
  'picked_up',
  'delivering',
]);

const NEW_STATUSES = ['pending', 'preparing', 'picking'];
const LIVE_ACTIVE_STATUSES = ['ready', 'assigned_to_courier', 'picked_up', 'delivering'];
const COMPLETED_STATUSES = ['delivered', 'cancelled'];

function clampInt(n, { min, max, fallback }) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  const i = Math.floor(v);
  return Math.max(min, Math.min(max, i));
}

function createOrderQueryRepositoryPg() {
  return {
    /**
     * @param {{ darkStoreId:number, status?:string, q?:string, limit?:number, offset?:number }} params
     */
    async listByStore(params) {
      return metrics.timeOp('orders.listByStore', async () => {
        const darkStoreId = Number(params.darkStoreId);
        const limit = clampInt(params.limit, { min: 1, max: 200, fallback: 50 });
        const offset = clampInt(params.offset, { min: 0, max: 100000, fallback: 0 });

        const where = [];
        const values = [];
        let i = 1;

        where.push(`o.dark_store_id = $${i}`);
        values.push(darkStoreId);
        i += 1;

        if (params.status) {
          if (params.status === 'active') {
            // special filter: all active statuses
            where.push(`o.status = ANY($${i}::text[])`);
            values.push(Array.from(ACTIVE_STATUSES));
            i += 1;
          } else {
            where.push(`o.status = $${i}`);
            values.push(String(params.status));
            i += 1;
          }
        }

        if (params.q) {
          const q = String(params.q || '').trim();
          if (q) {
            const maybeId = Number(q);
            if (Number.isFinite(maybeId) && maybeId > 0) {
              where.push(`o.id = $${i}`);
              values.push(Math.floor(maybeId));
              i += 1;
            } else {
              where.push(`(o.phone ILIKE $${i} OR o.address ILIKE $${i})`);
              values.push(`%${q}%`);
              i += 1;
            }
          }
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        // count
        const countSql = `SELECT COUNT(*)::int AS count FROM orders o ${whereSql}`;
        const countRes = await query(countSql, values);
        const total = countRes.rows[0]?.count ?? 0;

        // list (summary)
        const listSqlWithReturns = `
          SELECT
            o.id,
            o.status,
            o.total,
            o.created_at,
            o.updated_at,
            o.client_id,
            o.phone,
            o.address,
            o.comment,
            o.dark_store_id,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS items_count,
            (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS ordered_qty_total,
            (
              SELECT COALESCE(SUM(ri.quantity), 0)::int
              FROM order_returns r
              JOIN order_return_items ri ON ri.return_id = r.id
              WHERE r.order_id = o.id
            ) AS returned_qty_total
          FROM orders o
          ${whereSql}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        const listSqlNoReturns = `
          SELECT
            o.id,
            o.status,
            o.total,
            o.created_at,
            o.updated_at,
            o.client_id,
            o.phone,
            o.address,
            o.comment,
            o.dark_store_id,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS items_count,
            (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS ordered_qty_total,
            NULL::int AS returned_qty_total
          FROM orders o
          ${whereSql}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        let listRes;
        try {
          listRes = await query(listSqlWithReturns, values);
        } catch (e) {
          // Backward-compatible fallback if returns tables not migrated yet
          if (e && e.code === '42P01') {
            listRes = await query(listSqlNoReturns, values);
          } else {
            throw e;
          }
        }

        // simple status breakdown for current store
        const statusSql = `
          SELECT o.status, COUNT(*)::int AS count
          FROM orders o
          WHERE o.dark_store_id = $1
          GROUP BY o.status
        `;
        const statusRes = await query(statusSql, [darkStoreId]);
        const byStatus = Object.fromEntries(statusRes.rows.map((r) => [r.status, r.count]));

        return {
          total,
          limit,
          offset,
          orders: listRes.rows,
          byStatus,
        };
      });
    },

    /**
     * Live dashboard across all stores (optional filter by store).
     * @param {{
     *  darkStoreId?: number,
     *  tab?: 'new'|'active'|'completed'|'all',
     *  needsCourier?: boolean,
     *  problematic?: boolean,
     *  q?: string,
     *  limit?: number,
     *  offset?: number
     * }} params
     */
    async listLive(params = {}) {
      return metrics.timeOp('orders.listLive', async () => {
        const limit = clampInt(params.limit, { min: 1, max: 200, fallback: 50 });
        const offset = clampInt(params.offset, { min: 0, max: 100000, fallback: 0 });

        const where = [];
        const values = [];
        let i = 1;

        if (params.darkStoreId) {
          where.push(`o.dark_store_id = $${i}`);
          values.push(Number(params.darkStoreId));
          i += 1;
        }

        const tab = params.tab ? String(params.tab) : 'active';
        if (tab === 'new') {
          where.push(`o.status = ANY($${i}::text[])`);
          values.push(NEW_STATUSES);
          i += 1;
        } else if (tab === 'active') {
          where.push(`o.status = ANY($${i}::text[])`);
          values.push(LIVE_ACTIVE_STATUSES);
          i += 1;
        } else if (tab === 'completed') {
          where.push(`o.status = ANY($${i}::text[])`);
          values.push(COMPLETED_STATUSES);
          i += 1;
        } else if (tab === 'all') {
          // no filter
        } else {
          // allow direct status
          where.push(`o.status = $${i}`);
          values.push(tab);
          i += 1;
        }

        if (params.needsCourier) {
          where.push(`o.status = 'ready' AND o.courier_id IS NULL`);
        }

        // Search by order id or phone/email substring (basic)
        if (params.q) {
          const q = String(params.q).trim();
          if (q) {
            const maybeId = Number(q);
            if (Number.isFinite(maybeId) && maybeId > 0) {
              where.push(`o.id = $${i}`);
              values.push(Math.floor(maybeId));
              i += 1;
            } else {
              where.push(`(o.phone ILIKE $${i} OR o.address ILIKE $${i})`);
              values.push(`%${q}%`);
              i += 1;
            }
          }
        }

        // "Late" heuristic per status (minutes thresholds)
        const lateExpr = `
          CASE
            WHEN o.status = 'pending' AND o.created_at < NOW() - INTERVAL '10 minutes' THEN true
            WHEN o.status = 'preparing' AND o.created_at < NOW() - INTERVAL '15 minutes' THEN true
            WHEN o.status = 'picking' AND o.created_at < NOW() - INTERVAL '20 minutes' THEN true
            WHEN o.status = 'ready' AND o.created_at < NOW() - INTERVAL '15 minutes' THEN true
            WHEN o.status = 'assigned_to_courier' AND o.created_at < NOW() - INTERVAL '20 minutes' THEN true
            WHEN o.status = 'picked_up' AND o.created_at < NOW() - INTERVAL '45 minutes' THEN true
            WHEN o.status = 'delivering' AND o.created_at < NOW() - INTERVAL '60 minutes' THEN true
            ELSE false
          END
        `;

        if (params.problematic) {
          where.push(`${lateExpr} = true`);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        // counts
        const countRes = await query(`SELECT COUNT(*)::int AS count FROM orders o ${whereSql}`, values);
        const total = countRes.rows[0]?.count ?? 0;

        // health (always by current store filter, not tab)
        const healthWhere = [];
        const healthValues = [];
        let hi = 1;
        if (params.darkStoreId) {
          healthWhere.push(`o.dark_store_id = $${hi}`);
          healthValues.push(Number(params.darkStoreId));
          hi += 1;
        }
        const healthWhereSql = healthWhere.length ? `WHERE ${healthWhere.join(' AND ')}` : '';
        const byStatusRes = await query(
          `SELECT o.status, COUNT(*)::int AS count
           FROM orders o
           ${healthWhereSql}
           GROUP BY o.status`,
          healthValues
        );
        const byStatus = Object.fromEntries(byStatusRes.rows.map((r) => [r.status, r.count]));
        const lateRes = await query(
          `SELECT COUNT(*)::int AS count
           FROM orders o
           ${healthWhereSql}${healthWhereSql ? ' AND' : 'WHERE'} (${lateExpr}) = true`,
          healthValues
        );
        const lateCount = lateRes.rows[0]?.count ?? 0;

        // list
        const listSqlWithReturns = `
          SELECT
            o.id,
            o.status,
            o.total,
            o.created_at,
            o.updated_at,
            o.client_id,
            o.phone,
            o.address,
            o.dark_store_id,
            ds.name AS dark_store_name,
            o.courier_id,
            (${lateExpr}) AS is_late,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS items_count,
            (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS ordered_qty_total,
            (
              SELECT COALESCE(SUM(ri.quantity), 0)::int
              FROM order_returns r
              JOIN order_return_items ri ON ri.return_id = r.id
              WHERE r.order_id = o.id
            ) AS returned_qty_total
          FROM orders o
          LEFT JOIN dark_stores ds ON ds.id = o.dark_store_id
          ${whereSql}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        const listSqlNoReturns = `
          SELECT
            o.id,
            o.status,
            o.total,
            o.created_at,
            o.updated_at,
            o.client_id,
            o.phone,
            o.address,
            o.dark_store_id,
            ds.name AS dark_store_name,
            o.courier_id,
            (${lateExpr}) AS is_late,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS items_count,
            (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS ordered_qty_total,
            NULL::int AS returned_qty_total
          FROM orders o
          LEFT JOIN dark_stores ds ON ds.id = o.dark_store_id
          ${whereSql}
          ORDER BY o.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        let listRes;
        try {
          listRes = await query(listSqlWithReturns, values);
        } catch (e) {
          // Backward-compatible fallback if returns tables not migrated yet
          if (e && e.code === '42P01') {
            listRes = await query(listSqlNoReturns, values);
          } else {
            throw e;
          }
        }

        const needsCourierCountRes = await query(
          `SELECT COUNT(*)::int AS count
           FROM orders o
           ${healthWhereSql}${healthWhereSql ? ' AND' : 'WHERE'} (o.status = 'ready' AND o.courier_id IS NULL)`,
          healthValues
        );

        return {
          total,
          limit,
          offset,
          orders: listRes.rows,
          health: {
            byStatus,
            lateCount,
            needsCourierCount: needsCourierCountRes.rows[0]?.count ?? 0,
          },
        };
      });
    },
  };
}

module.exports = { createOrderQueryRepositoryPg };


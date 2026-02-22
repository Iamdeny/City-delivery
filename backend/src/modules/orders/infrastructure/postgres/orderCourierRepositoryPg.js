/**
 * OrderCourierRepository (Postgres)
 * - Reads/updates courier assignment for orders
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function createOrderCourierRepositoryPg() {
  return {
    async getById(orderId) {
      return metrics.timeOp('orders.getCourierAssignment', async () => {
        const res = await query(
          `SELECT id, status, courier_id, dark_store_id, updated_at
           FROM orders
           WHERE id = $1`,
          [orderId]
        );
        return res.rows[0] || null;
      });
    },

    /**
     * Ensure courier record exists for given user_id.
     * This is resilient for legacy datasets where user.role='courier' exists without a couriers row.
     */
    async ensureCourierByUserId(userId) {
      return metrics.timeOp('orders.ensureCourierByUserId', async () => {
        const selectSql = `SELECT
             c.id AS courier_id,
             c.user_id,
             c.is_active AS courier_active,
             u.id AS user_id,
             u.role AS user_role,
             u.is_active AS user_active,
             u.email,
             u.name
           FROM couriers c
           JOIN users u ON u.id = c.user_id
           WHERE c.user_id = $1`;

        const res = await query(selectSql, [userId]);
        if (res.rows[0]) return res.rows[0];

        // Create minimal courier profile if missing.
        await query(
          `INSERT INTO couriers (user_id, is_active)
           VALUES ($1, true)
           ON CONFLICT (user_id) DO UPDATE SET is_active = EXCLUDED.is_active`,
          [userId]
        );

        const res2 = await query(selectSql, [userId]);
        return res2.rows[0] || null;
      });
    },

    async setCourier(orderId, courierIdOrNull) {
      return metrics.timeOp('orders.setCourier', async () => {
        const res = await query(
          `UPDATE orders
           SET courier_id = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, status, courier_id, dark_store_id, updated_at`,
          [courierIdOrNull, orderId]
        );
        return res.rows[0] || null;
      });
    },
  };
}

module.exports = { createOrderCourierRepositoryPg };


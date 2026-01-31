/**
 * OrderStatusRepository (Postgres)
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function createOrderStatusRepositoryPg() {
  return {
    async getById(orderId) {
      return metrics.timeOp('orders.getById', async () => {
        const res = await query(
          `SELECT id, client_id, status, dark_store_id, updated_at
           FROM orders
           WHERE id = $1`,
          [orderId]
        );
        return res.rows[0] || null;
      });
    },

    async updateStatus(orderId, status) {
      return metrics.timeOp('orders.updateStatus', async () => {
        const res = await query(
          `UPDATE orders
           SET status = $1, updated_at = NOW()
           WHERE id = $2
           RETURNING id, status, dark_store_id, updated_at`,
          [status, orderId]
        );
        return res.rows[0];
      });
    },
  };
}

module.exports = { createOrderStatusRepositoryPg };


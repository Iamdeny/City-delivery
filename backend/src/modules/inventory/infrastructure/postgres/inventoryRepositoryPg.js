/**
 * InventoryRepository (Postgres)
 *
 * Provides read-side queries for Ops UI:
 * - products with stock/reserved/free
 * - active reservations
 *
 * Notes:
 * - Some environments may not have `reserved_quantity` column on `products`
 *   or `inventory_reservations` table yet. We fallback gracefully.
 */

const { query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

function createInventoryRepositoryPg() {
  return {
    async listProductsByStore(darkStoreId) {
      return metrics.timeOp('inventory.products.listByStore', async () => {
        // Prefer schema where reserved_quantity exists on products (legacy inventoryService approach)
        const sqlWithReserved = `
          SELECT
            p.id,
            p.name,
            p.category,
            p.price,
            p.image,
            p.in_stock,
            p.stock_quantity,
            COALESCE(p.reserved_quantity, 0) AS reserved_quantity,
            (p.stock_quantity - COALESCE(p.reserved_quantity, 0)) AS free_quantity
          FROM products p
          WHERE p.dark_store_id = $1
          ORDER BY p.category ASC, p.name ASC
        `;

        try {
          const result = await query(sqlWithReserved, [darkStoreId]);
          return result.rows;
        } catch (err) {
          // Fallback if reserved_quantity column doesn't exist yet
          const sqlFallback = `
            SELECT
              p.id,
              p.name,
              p.category,
              p.price,
              p.image,
              p.in_stock,
              p.stock_quantity,
              0::int AS reserved_quantity,
              p.stock_quantity AS free_quantity
            FROM products p
            WHERE p.dark_store_id = $1
            ORDER BY p.category ASC, p.name ASC
          `;
          const result = await query(sqlFallback, [darkStoreId]);
          return result.rows;
        }
      });
    },

    async listActiveReservationsByStore(darkStoreId) {
      return metrics.timeOp('inventory.reservations.listActiveByStore', async () => {
        const sql = `
          SELECT
            r.id,
            r.product_id,
            p.name AS product_name,
            p.image AS product_image,
            r.user_id,
            r.quantity,
            r.reserved_at,
            r.expires_at,
            r.status,
            r.order_id,
            EXTRACT(EPOCH FROM (r.expires_at - NOW())) AS seconds_left
          FROM inventory_reservations r
          JOIN products p ON p.id = r.product_id
          WHERE r.dark_store_id = $1
            AND r.status = 'active'
            AND r.expires_at > NOW()
          ORDER BY r.expires_at ASC
          LIMIT 500
        `;

        try {
          const result = await query(sql, [darkStoreId]);
          return result.rows;
        } catch (err) {
          // Table might not exist in some DB setups; return empty list gracefully
          return [];
        }
      });
    },
  };
}

module.exports = { createInventoryRepositoryPg };


/**
 * OrderReturnRepository (Postgres)
 *
 * Return operation:
 * - ensures return tables exist (CREATE TABLE IF NOT EXISTS)
 * - locks order row
 * - supports multiple partial returns (accumulates per product)
 * - prevents returning more than ordered - returned
 * - restocks products.stock_quantity
 */

const { getClient } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');

let ensured = false;

async function ensureTables(client) {
  if (ensured) return;

  // These are safe in Postgres and won't break existing DBs.
  await client.query(`
    CREATE TABLE IF NOT EXISTS order_returns (
      id SERIAL PRIMARY KEY,
      order_id INTEGER UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      created_by INTEGER REFERENCES users(id),
      reason TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS order_return_items (
      id SERIAL PRIMARY KEY,
      return_id INTEGER REFERENCES order_returns(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(return_id, product_id)
    )
  `);

  ensured = true;
}

function createOrderReturnRepositoryPg() {
  return {
    async getSummary(params) {
      return metrics.timeOp('orders.return.summary', async () => {
        const client = await getClient();
        try {
          await client.query('BEGIN');
          await ensureTables(client);

          const orderRes = await client.query(
            `SELECT id, status, dark_store_id
             FROM orders
             WHERE id = $1`,
            [params.orderId]
          );
          const order = orderRes.rows[0];
          if (!order) {
            await client.query('ROLLBACK');
            return { notFound: true };
          }

          const retRes = await client.query(
            `SELECT id, order_id, created_by, reason, created_at
             FROM order_returns
             WHERE order_id = $1`,
            [params.orderId]
          );
          const ret = retRes.rows[0] || null;

          const orderedRes = await client.query(
            `SELECT oi.product_id, SUM(oi.quantity)::int AS ordered_qty
             FROM order_items oi
             WHERE oi.order_id = $1
             GROUP BY oi.product_id`,
            [params.orderId]
          );

          const returnedRes = await client.query(
            `SELECT ri.product_id, SUM(ri.quantity)::int AS returned_qty
             FROM order_return_items ri
             JOIN order_returns r ON r.id = ri.return_id
             WHERE r.order_id = $1
             GROUP BY ri.product_id`,
            [params.orderId]
          );
          const returnedMap = new Map(returnedRes.rows.map((r) => [Number(r.product_id), Number(r.returned_qty)]));

          const items = orderedRes.rows.map((r) => {
            const productId = Number(r.product_id);
            const orderedQty = Number(r.ordered_qty);
            const returnedQty = Number(returnedMap.get(productId) || 0);
            const remainingQty = Math.max(0, orderedQty - returnedQty);
            return { productId, orderedQty, returnedQty, remainingQty };
          });

          await client.query('COMMIT');
          return { success: true, order, return: ret, items };
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      });
    },

    /**
     * @param {{
     *  orderId:number,
     *  actorId:number,
     *  reason: string|null,
     *  items: null | Array<{productId:number, quantity:number}>
     * }} params
     */
    async returnOrderTx(params) {
      return metrics.timeOp('orders.return', async () => {
        const client = await getClient();
        try {
          await client.query('BEGIN');
          await ensureTables(client);

          // Lock order to avoid concurrent returns
          const orderRes = await client.query(
            `SELECT id, status, dark_store_id
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [params.orderId]
          );
          const order = orderRes.rows[0];
          if (!order) {
            await client.query('ROLLBACK');
            return { alreadyReturned: false, return: null, notFound: true };
          }

          // Get or create return header (one per order)
          const existingRes = await client.query(
            `SELECT id, order_id, created_by, reason, created_at
             FROM order_returns
             WHERE order_id = $1`,
            [params.orderId]
          );
          let ret = existingRes.rows[0] || null;
          if (!ret) {
            const retRes = await client.query(
              `INSERT INTO order_returns (order_id, created_by, reason)
               VALUES ($1, $2, $3)
               RETURNING id, order_id, created_by, reason, created_at`,
              [params.orderId, params.actorId || null, params.reason]
            );
            ret = retRes.rows[0];
          } else if (params.reason) {
            // update reason to last provided (useful for ops)
            const upd = await client.query(
              `UPDATE order_returns
               SET reason = $1
               WHERE id = $2
               RETURNING id, order_id, created_by, reason, created_at`,
              [params.reason, ret.id]
            );
            ret = upd.rows[0] || ret;
          }

          // Load ordered items
          const itemsRes = await client.query(
            `SELECT oi.product_id, oi.quantity
             FROM order_items oi
             WHERE oi.order_id = $1`,
            [params.orderId]
          );
          const ordered = itemsRes.rows || [];
          const orderedMap = new Map();
          for (const r of ordered) {
            orderedMap.set(Number(r.product_id), (orderedMap.get(Number(r.product_id)) || 0) + Number(r.quantity));
          }

          // Load already returned quantities
          const returnedRes = await client.query(
            `SELECT product_id, SUM(quantity)::int AS returned_qty
             FROM order_return_items
             WHERE return_id = $1
             GROUP BY product_id`,
            [ret.id]
          );
          const returnedMap = new Map(returnedRes.rows.map((r) => [Number(r.product_id), Number(r.returned_qty)]));

          // Determine return items: full or partial
          let returnItems = [];
          if (!params.items) {
            // full return means "return everything remaining"
            returnItems = Array.from(orderedMap.entries())
              .map(([productId, orderedQty]) => {
                const already = Number(returnedMap.get(productId) || 0);
                const remaining = Math.max(0, Number(orderedQty) - already);
                return { productId, quantity: remaining };
              })
              .filter((x) => x.quantity > 0);
          } else {
            for (const it of params.items) {
              const orderedQty = orderedMap.get(it.productId) || 0;
              if (orderedQty <= 0) {
                await client.query('ROLLBACK');
                return { alreadyReturned: false, return: null, badRequest: { error: 'ITEM_NOT_IN_ORDER', productId: it.productId } };
              }
              const already = Number(returnedMap.get(it.productId) || 0);
              const remaining = Math.max(0, Number(orderedQty) - already);
              if (it.quantity > remaining) {
                await client.query('ROLLBACK');
                return {
                  badRequest: {
                    error: 'ITEM_QTY_EXCEEDS_REMAINING',
                    productId: it.productId,
                    orderedQty,
                    returnedQty: already,
                    remainingQty: remaining,
                  },
                };
              }
              returnItems.push({ productId: it.productId, quantity: it.quantity });
            }
          }

          if (returnItems.length === 0) {
            await client.query('ROLLBACK');
            return { badRequest: { error: 'ALREADY_FULLY_RETURNED' } };
          }

          // Insert return items & restock
          for (const it of returnItems) {
            await client.query(
              `INSERT INTO order_return_items (return_id, product_id, quantity)
               VALUES ($1, $2, $3)
               ON CONFLICT (return_id, product_id) DO UPDATE
                 SET quantity = order_return_items.quantity + EXCLUDED.quantity`,
              [ret.id, it.productId, it.quantity]
            );
            await client.query(
              `UPDATE products
               SET stock_quantity = stock_quantity + $1,
                   in_stock = (stock_quantity + $1 > 0),
                   updated_at = NOW()
               WHERE id = $2`,
              [it.quantity, it.productId]
            );
          }

          await client.query('COMMIT');
          // return fresh summary
          const summary = await metrics.timeOp('orders.return.summary.after', async () =>
            this.getSummary({ orderId: params.orderId })
          );
          return { ok: true, return: ret, summary, delta: returnItems };
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      });
    },
  };
}

module.exports = { createOrderReturnRepositoryPg };


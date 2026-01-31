/**
 * Postgres OrderRepository (infrastructure adapter).
 */

const { getClient, query } = require('../../../../config/database');
const { metrics } = require('../../../../utils/metrics');
 

function createOrderRepositoryPg() {
  return {
    async isStoreActive(storeId) {
      const result = await query(
        'SELECT 1 FROM dark_stores WHERE id = $1 AND is_active = true LIMIT 1',
        [storeId]
      );
      return result.rows.length > 0;
    },

    async getAnyActiveStoreId() {
      const storeResult = await query(
        'SELECT id FROM dark_stores WHERE is_active = true LIMIT 1'
      );
      return storeResult.rows.length > 0 ? storeResult.rows[0].id : null;
    },

    async isStoreDeliverableForCoords(storeId, lat, lng) {
      const res = await query(
        `SELECT * FROM (
          SELECT
            id,
            delivery_radius,
            (6371 * acos(
              cos(radians($2)) *
              cos(radians(latitude)) *
              cos(radians(longitude) - radians($3)) +
              sin(radians($2)) *
              sin(radians(latitude))
            )) AS distance_km
          FROM dark_stores
          WHERE id = $1
            AND is_active = true
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
        ) s
        WHERE distance_km <= delivery_radius / 1000
        LIMIT 1`,
        [storeId, lat, lng]
      );
      return res.rows.length > 0;
    },

    /**
     * Creates order + items transactionally and returns { order, total }.
     */
    async createOrderWithItemsTx({
      userId,
      darkStoreId,
      phone,
      address,
      comment,
      latitude,
      longitude,
      items,
    }) {
      return metrics.timeOp('orders.createOrderWithItemsTx', async () => {
      const client = await getClient();
      try {
        await client.query('BEGIN');

        const productIds = items.map((item) => item.productId);
        const productResult = await client.query(
          'SELECT id, price, in_stock, name FROM products WHERE id = ANY($1::int[])',
          [productIds]
        );

        const productMap = new Map(productResult.rows.map((p) => [p.id, p]));

        let total = 0;
        const productPrices = [];

        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product) {
            throw new Error(`Товар с ID ${item.productId} не найден`);
          }
          if (!product.in_stock) {
            throw new Error(
              `Товар "${product.name}" (ID: ${item.productId}) отсутствует на складе`
            );
          }

          const price = parseFloat(product.price);
          if (isNaN(price) || price <= 0) {
            throw new Error(
              `Невалидная цена для товара "${product.name}" (ID: ${item.productId})`
            );
          }

          total += price * item.quantity;
          productPrices.push({
            productId: item.productId,
            quantity: item.quantity,
            price,
          });
        }

        if (total <= 0) {
          throw new Error('Сумма заказа должна быть больше нуля');
        }

        const orderResult = await client.query(
          `INSERT INTO orders (
            client_id, dark_store_id, phone, address, comment,
            client_latitude, client_longitude, status, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            userId,
            darkStoreId,
            phone,
            address,
            comment || null,
            latitude || null,
            longitude || null,
            'pending',
            total,
          ]
        );

        const order = orderResult.rows[0];

        for (const item of productPrices) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price)
             VALUES ($1, $2, $3, $4)`,
            [order.id, item.productId, item.quantity, item.price]
          );
        }

        await client.query('COMMIT');
        return { order, total };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      });
    },
  };
}

module.exports = {
  createOrderRepositoryPg,
};


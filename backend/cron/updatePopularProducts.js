const { query } = require('../src/config/database');
const logger = require('../src/utils/logger');

const TOP_LIMIT = 1000; // количество товаров в топе (можно настроить)

async function updatePopularProducts() {
  try {
    await query('BEGIN');

    // Очищаем таблицу перед вставкой нового топа
    await query('TRUNCATE popular_products');

    // Рассчитываем популярность на основе продаж за последние 30 дней
    const result = await query(
      `
      WITH sales AS (
        SELECT 
          oi.product_id,
          COALESCE(SUM(oi.quantity), 0) AS total_sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.created_at >= NOW() - INTERVAL '30 days'
          AND o.status IN ('completed', 'delivered', 'paid')
        GROUP BY oi.product_id
      ),
      ranked AS (
        SELECT 
          product_id,
          total_sold AS score,
          ROW_NUMBER() OVER (ORDER BY total_sold DESC, product_id) AS rank
        FROM sales
        WHERE total_sold > 0
        ORDER BY total_sold DESC
        LIMIT $1
      )
      INSERT INTO popular_products (product_id, score, rank, updated_at)
      SELECT product_id, score, rank, NOW()
      FROM ranked
    `,
      [TOP_LIMIT]
    );

    await query('COMMIT');

    logger.info(
      `✅ Popular products updated. Inserted ${result.rowCount} records.`
    );
  } catch (error) {
    await query('ROLLBACK');
    logger.error('❌ Failed to update popular products:', error);
  }
}

module.exports = updatePopularProducts;

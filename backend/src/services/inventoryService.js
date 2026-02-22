/**
 * Inventory Reservation Service
 * Критический модуль для предотвращения overbooking
 * Паттерн: Uber Eats / DoorDash / Instacart
 */

const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');

class InventoryService {
  /**
   * Резервирование товаров
   * @param {Array} items - Массив товаров [{productId, quantity}]
   * @param {number} userId - ID пользователя
   * @param {number} darkStoreId - ID склада
   * @param {number} ttl - Время жизни резервации (секунды, по умолчанию 15 минут)
   * @returns {Promise<{success: boolean, reservationIds?: number[], expiresAt?: Date, error?: string}>}
   */
  async reserve(items, userId, darkStoreId, ttl = 900) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Проверить наличие товаров
      const availabilityCheck = await this.checkAvailability(
        items,
        darkStoreId,
        client
      );
      
      if (!availabilityCheck.available) {
        await client.query('ROLLBACK');
        return {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          unavailableItems: availabilityCheck.unavailableItems
        };
      }
      
      // 2. Создать резервацию
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      const reservations = [];
      for (const item of items) {
        const result = await client.query(
          `INSERT INTO inventory_reservations 
           (product_id, dark_store_id, user_id, quantity, expires_at)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [item.productId, darkStoreId, userId, item.quantity, expiresAt]
        );
        
        reservations.push(result.rows[0].id);
      }
      
      // 3. Обновить reserved_quantity в products
      for (const item of items) {
        await client.query(
          `UPDATE products
           SET reserved_quantity = reserved_quantity + $1,
               updated_at = NOW()
           WHERE id = $2 AND dark_store_id = $3`,
          [item.quantity, item.productId, darkStoreId]
        );
      }
      
      await client.query('COMMIT');
      
      logger.log(`✅ Товары зарезервированы для user ${userId}:`, reservations);
      
      // 4. Запланировать автоматическую отмену
      setTimeout(async () => {
        await this.checkAndExpire(reservations);
      }, ttl * 1000);
      
      return {
        success: true,
        reservationIds: reservations,
        expiresAt
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Ошибка резервирования товаров:', error);
      return {
        success: false,
        error: 'RESERVATION_FAILED',
        details: error.message
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * Проверка доступности товаров
   * @param {Array} items - Массив товаров { productId, quantity }
   * @param {number} darkStoreId - ID склада
   * @param {Object|null} client - Database client (optional, если null - создаст свой)
   */
  async checkAvailability(items, darkStoreId, client = null) {
    const unavailableItems = [];
    const shouldReleaseClient = !client;
    
    if (!client) {
      client = await getClient();
    }
    
    try {
      for (const item of items) {
        const result = await client.query(
          `SELECT 
             p.stock_quantity,
             COALESCE(p.reserved_quantity, 0) as reserved_quantity,
             (p.stock_quantity - COALESCE(p.reserved_quantity, 0)) as free_quantity
           FROM products p
           WHERE p.id = $1 AND p.dark_store_id = $2`,
          [item.productId, darkStoreId]
        );
      
      if (result.rows.length === 0) {
        unavailableItems.push({
          productId: item.productId,
          reason: 'NOT_FOUND_IN_STORE'
        });
        continue;
      }
      
      const product = result.rows[0];
      if (product.free_quantity < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: product.free_quantity,
          reason: 'INSUFFICIENT_STOCK'
        });
      }
    }
    
    return {
      available: unavailableItems.length === 0,
      unavailableItems
    };
    } finally {
      if (shouldReleaseClient) {
        client.release();
      }
    }
  }
  
  /**
   * Подтверждение резервации (при создании заказа)
   * @param {number[]} reservationIds - ID резерваций
   * @param {number} orderId - ID заказа
   */
  async confirm(reservationIds, orderId) {
    const ids = Array.isArray(reservationIds) ? reservationIds : [reservationIds];
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Mark reservations as completed and link to order.
      // Return details to adjust stock/reserved.
      const result = await client.query(
        `UPDATE inventory_reservations
         SET status = 'completed',
             order_id = $1,
             updated_at = NOW()
         WHERE id = ANY($2::int[]) AND status = 'active'
         RETURNING id, product_id, dark_store_id, quantity`,
        [orderId, ids]
      );

      // Apply inventory consumption:
      // - stock_quantity decreases (sold/committed)
      // - reserved_quantity decreases (reservation is no longer active)
      for (const r of result.rows) {
        await client.query(
          `UPDATE products
           SET stock_quantity = GREATEST(stock_quantity - $1, 0),
               reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - $1, 0),
               in_stock = (GREATEST(stock_quantity - $1, 0) > 0),
               updated_at = NOW()
           WHERE id = $2 AND dark_store_id = $3`,
          [r.quantity, r.product_id, r.dark_store_id]
        );
      }

      await client.query('COMMIT');

      logger.log(`✅ Резервации подтверждены для заказа ${orderId}`);
      return { success: true, confirmed: result.rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Ошибка подтверждения резервации:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }
  
  /**
   * Отмена резервации (возврат товаров)
   * @param {number[]} reservationIds - ID резерваций
   */
  async release(reservationIds) {
    const ids = Array.isArray(reservationIds) ? reservationIds : [reservationIds];
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // 1. Получить информацию о резервациях
      const reservations = await client.query(
        `SELECT product_id, dark_store_id, quantity
         FROM inventory_reservations
         WHERE id = ANY($1::int[]) AND status = 'active'`,
        [ids]
      );
      
      // 2. Обновить статус резервации
      await client.query(
        `UPDATE inventory_reservations
         SET status = 'cancelled',
             updated_at = NOW()
         WHERE id = ANY($1::int[])`,
        [ids]
      );
      
      // 3. Вернуть товары в products
      for (const res of reservations.rows) {
        await client.query(
          `UPDATE products
           SET reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - $1, 0),
               updated_at = NOW()
           WHERE id = $2 AND dark_store_id = $3`,
          [res.quantity, res.product_id, res.dark_store_id]
        );
      }
      
      await client.query('COMMIT');
      
      logger.log(`✅ Резервации отменены:`, ids);
      return { success: true, released: reservations.rows.length };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Ошибка отмены резервации:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Отмена заказа (возврат/освобождение товара по order_id)
   * - If reservations are still active: just unreserve (reserved_quantity - qty)
   * - If reservations are completed (order created): restock (stock_quantity + qty)
   *   and also clamp reserved_quantity down (for legacy data where confirm didn't decrement it)
   */
  async cancelOrder(orderId) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const reservationsRes = await client.query(
        `SELECT id, product_id, dark_store_id, quantity, status
         FROM inventory_reservations
         WHERE order_id = $1
           AND status IN ('active', 'completed')`,
        [orderId]
      );

      const reservations = reservationsRes.rows || [];
      if (reservations.length === 0) {
        await client.query('COMMIT');
        return { success: true, released: 0 };
      }

      const ids = reservations.map((r) => r.id);

      await client.query(
        `UPDATE inventory_reservations
         SET status = 'cancelled',
             updated_at = NOW()
         WHERE id = ANY($1::int[])`,
        [ids]
      );

      for (const r of reservations) {
        if (r.status === 'active') {
          await client.query(
            `UPDATE products
             SET reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - $1, 0),
                 updated_at = NOW()
             WHERE id = $2 AND dark_store_id = $3`,
            [r.quantity, r.product_id, r.dark_store_id]
          );
        } else {
          // completed → return to stock
          await client.query(
            `UPDATE products
             SET stock_quantity = stock_quantity + $1,
                 reserved_quantity = GREATEST(COALESCE(reserved_quantity, 0) - $1, 0),
                 in_stock = (stock_quantity + $1 > 0),
                 updated_at = NOW()
             WHERE id = $2 AND dark_store_id = $3`,
            [r.quantity, r.product_id, r.dark_store_id]
          );
        }
      }

      await client.query('COMMIT');
      logger.log(`✅ Заказ отменён, резервации освобождены: orderId=${orderId}`, ids);
      return { success: true, released: reservations.length };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Ошибка отмены заказа (inventory):', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }
  
  /**
   * Проверка и автоматическая отмена просроченных резерваций
   * @private
   */
  async checkAndExpire(reservationIds) {
    try {
      const result = await query(
        `SELECT id FROM inventory_reservations
         WHERE id = ANY($1::int[])
           AND status = 'active'
           AND expires_at < NOW()`,
        [reservationIds]
      );
      
      if (result.rows.length > 0) {
        const expiredIds = result.rows.map(r => r.id);
        await this.release(expiredIds);
        logger.log(`⏰ Автоматически отменены просроченные резервации:`, expiredIds);
      }
    } catch (error) {
      logger.error('❌ Ошибка проверки просроченных резерваций:', error);
    }
  }
  
  /**
   * Получить текущие резервации пользователя
   * @param {number} userId - ID пользователя
   */
  async getUserReservations(userId) {
    try {
      const result = await query(
        `SELECT 
           r.id,
           r.product_id,
           p.name as product_name,
           p.image as product_image,
           r.quantity,
           r.expires_at,
           EXTRACT(EPOCH FROM (r.expires_at - NOW())) as seconds_left
         FROM inventory_reservations r
         JOIN products p ON r.product_id = p.id
         WHERE r.user_id = $1
           AND r.status = 'active'
           AND r.expires_at > NOW()
         ORDER BY r.created_at DESC`,
        [userId]
      );
      
      return {
        success: true,
        reservations: result.rows
      };
    } catch (error) {
      logger.error('❌ Ошибка получения резерваций:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Очистка всех просроченных резерваций (cron job)
   * Запускать каждые 5 минут
   */
  async cleanupExpired() {
    try {
      const result = await query(
        `SELECT id FROM inventory_reservations
         WHERE status = 'active'
           AND expires_at < NOW()
         LIMIT 100`
      );
      
      if (result.rows.length > 0) {
        const expiredIds = result.rows.map(r => r.id);
        await this.release(expiredIds);
        logger.log(`🧹 Очистка: удалено ${expiredIds.length} просроченных резерваций`);
      }
      
      return { success: true, cleaned: result.rows.length };
    } catch (error) {
      logger.error('❌ Ошибка очистки просроченных резерваций:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new InventoryService();


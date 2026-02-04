/**
 * Сервис управления заказами
 * Обрабатывает жизненный цикл заказа: создание, отмена, смена статусов
 */

const { query, getClient } = require('../config/database');
const orderDispatcher = require('./orderDispatcher');
const inventoryService = require('./inventoryService');
const queueService = require('./queueService');
const logger = require('../utils/logger');

class OrderService {
  /**
   * Создание нового заказа
   * @param {number} userId - ID пользователя
   * @param {object} orderData - Данные заказа
   * @returns {object} - Объект с созданным заказом и метаданными
   */
  async createOrder(userId, orderData) {
    const { items, address, phone, comment, latitude, longitude } = orderData;
    
    // 1. Определение склада и проверка зоны
    let darkStoreId = null;
    let zoneCheckResult = null;

    if (latitude && longitude) {
      zoneCheckResult = await orderDispatcher.checkDeliveryZone(latitude, longitude);
      if (!zoneCheckResult.available) {
        throw {
          status: 400,
          error: zoneCheckResult.error || 'DELIVERY_UNAVAILABLE',
          message: zoneCheckResult.message || 'Доставка в ваш район недоступна',
          details: zoneCheckResult.details
        };
      }
      darkStoreId = zoneCheckResult.store?.id;
    }

    // Fallback на первый активный склад
    if (!darkStoreId) {
      const storeResult = await query(
        'SELECT id FROM dark_stores WHERE is_active = true LIMIT 1'
      );
      if (storeResult.rows.length > 0) {
        darkStoreId = storeResult.rows[0].id;
      } else {
        throw { status: 400, error: 'NO_STORE_AVAILABLE', message: 'Нет доступных складов' };
      }
    }

    // 2. Резервирование товаров
    const reservation = await inventoryService.reserve(items, userId, darkStoreId, 900);
    if (!reservation.success) {
      throw {
        status: 400,
        error: reservation.error,
        message: 'Некоторые товары недоступны',
        unavailableItems: reservation.unavailableItems
      };
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 3. Расчет стоимости
      const productIds = items.map(item => item.productId);
      const productResult = await client.query(
        'SELECT id, price, in_stock, name FROM products WHERE id = ANY($1::int[])',
        [productIds]
      );

      const productMap = new Map(productResult.rows.map(p => [p.id, p]));
      let total = 0;
      const orderItemsToInsert = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product || !product.in_stock) {
          throw new Error(`Товар "${product?.name || item.productId}" недоступен`);
        }
        const price = parseFloat(product.price);
        total += price * item.quantity;
        orderItemsToInsert.push({ productId: item.productId, quantity: item.quantity, price: price });
      }

      if (total <= 0) throw new Error('Сумма заказа должна быть больше нуля');

      // 4. Сохранение заказа
      const orderResult = await client.query(
        `INSERT INTO orders (
          client_id, dark_store_id, phone, address, comment, 
          client_latitude, client_longitude, status, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [userId, darkStoreId, phone, address, comment || null, latitude || null, longitude || null, 'pending', total]
      );

      const order = orderResult.rows[0];

      // 5. Сохранение позиций
      for (const item of orderItemsToInsert) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.price]
        );
      }

      await client.query('COMMIT');
      
      // 6. Подтверждение резерва
      await inventoryService.confirm(reservation.reservationIds, order.id);

      // 7. Асинхронные задачи (не блокируют ответ)
      this._runAsyncTasks(order, userId, items, darkStoreId, latitude, longitude, zoneCheckResult);

      return {
        order: { ...order, total },
        reservation: { expiresAt: reservation.expiresAt, status: 'confirmed' },
        zoneWarning: zoneCheckResult?.warning,
        distance: zoneCheckResult?.store?.distance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      if (reservation && reservation.success) {
        await inventoryService.release(reservation.reservationIds).catch(e => logger.error('Release failed:', e));
      }
      logger.error('[OrderService] Order creation failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Запуск асинхронных задач после создания заказа
   * @private
   */
  async _runAsyncTasks(order, userId, items, darkStoreId, latitude, longitude, zoneCheckResult) {
    try {
      // Уведомление
      await queueService.addNotification('order_created', userId, {
        orderId: order.id,
        total: order.total,
        itemsCount: items.length
      }, 'critical');
      
      // Аналитика
      await queueService.addAnalytics('order_created', {
        orderId: order.id,
        userId,
        darkStoreId,
        total: order.total,
        itemsCount: items.length,
        hasCoordinates: !!(latitude && longitude)
      });

      // Диспетчеризация
      orderDispatcher.dispatchOrder(order.id, zoneCheckResult?.store).catch(err => {
        logger.error('Ошибка диспетчеризации заказа:', err);
      });
    } catch (err) {
      logger.error('Error in order post-processing tasks:', err);
    }
  }


  /**
   * Получение списка заказов пользователя с учетом роли
   * @param {number} userId
   * @param {string} role
   */
  async getUserOrders(userId, role) {
    let queryText;
    let params = [userId];

    if (role === 'customer') {
      queryText = `
        SELECT o.*, json_agg(json_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'product_name', p.name,
          'quantity', oi.quantity, 'price', oi.price
        )) as items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.client_id = $1
        GROUP BY o.id ORDER BY o.created_at DESC`;
    } else if (role === 'courier') {
      queryText = `
        SELECT o.* FROM orders o
        JOIN couriers c ON c.user_id = $1
        WHERE o.courier_id = c.id
        ORDER BY o.created_at DESC`;
    } else if (role === 'picker') {
      queryText = `
        SELECT o.* FROM orders o
        JOIN order_pickers op ON op.user_id = $1
        WHERE o.picker_id = op.id
        ORDER BY o.created_at DESC`;
    } else {
      throw { status: 403, message: 'Недостаточно прав' };
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Получение деталей заказа
   * @param {number} orderId
   * @param {object} user {id, role}
   */
  async getOrderById(orderId, user) {
    const result = await query(
      `SELECT o.*, json_agg(json_build_object(
          'id', oi.id, 'product_id', oi.product_id, 'product_name', p.name,
          'product_image', p.image, 'quantity', oi.quantity, 'price', oi.price
        )) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id`,
      [orderId]
    );

    if (result.rows.length === 0) {
      throw { status: 404, message: 'Заказ не найден' };
    }

    const order = result.rows[0];

    // Проверка прав доступа
    if (user.role === 'customer' && order.client_id !== user.id) {
      throw { status: 403, message: 'Нет доступа к этому заказу' };
    }

    return order;
  }

  /**
   * Обновление статуса заказа
   */
  async updateStatus(orderId, status) {
    await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, orderId]
    );
    return { success: true };
  }
}

module.exports = new OrderService();

/**
 * Маршруты для работы с заказами
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');
const orderDispatcher = require('../services/orderDispatcher');
const inventoryService = require('../services/inventoryService'); // ✅ NEW: Inventory Reservation
const queueService = require('../services/queueService'); // ✅ NEW: Message Queue
const logger = require('../utils/logger');
const deliveryConfig = require('../config/delivery');
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require('../validators/order.validator');

/**
 * Создание нового заказа (клиент)
 */
router.post('/', authenticate, requireRole('customer'), validateCreateOrder, async (req, res) => {
  try {
    const { items, address, phone, comment, latitude, longitude } = req.body;
    const userId = req.user.id;

    // Валидация уже выполнена в middleware validateCreateOrder

    // 1. Проверка зоны доставки и определение склада
    let zoneCheckResult = null;
    let darkStoreId = null;
    
    if (latitude && longitude) {
      zoneCheckResult = await orderDispatcher.checkDeliveryZone(
        latitude,
        longitude
      );
      
      if (!zoneCheckResult.available) {
        return res.status(400).json({
          error: zoneCheckResult.message || 'Доставка в ваш район недоступна',
          details: zoneCheckResult.details,
        });
      }
      
      // Получаем ID склада из результата проверки зоны
      darkStoreId = zoneCheckResult.store?.id;
    }
    
    // Если склад не определен, берем первый активный (fallback)
    if (!darkStoreId) {
      const storeResult = await query(
        'SELECT id FROM dark_stores WHERE is_active = true LIMIT 1'
      );
      if (storeResult.rows.length > 0) {
        darkStoreId = storeResult.rows[0].id;
      } else {
        return res.status(400).json({
          error: 'NO_STORE_AVAILABLE',
          message: 'В данный момент нет доступных складов'
        });
      }
    }
    
    // 2. ✅ РЕЗЕРВИРОВАНИЕ ТОВАРОВ (15 минут TTL)
    logger.log(`Резервирование товаров для user ${userId}, склад ${darkStoreId}`);
    const reservation = await inventoryService.reserve(
      items,
      userId,
      darkStoreId,
      900 // 15 minutes
    );
    
    if (!reservation.success) {
      // Если резервация не удалась - возвращаем детальную ошибку
      return res.status(400).json({
        success: false,
        error: reservation.error,
        message: 'Некоторые товары недоступны на складе',
        unavailableItems: reservation.unavailableItems,
        // TODO: Здесь можно добавить предложение альтернативных товаров
      });
    }
    
    logger.log(`✅ Товары зарезервированы:`, reservation.reservationIds);

    const { getClient } = require('../config/database');
    const client = await getClient();
    
    try {
      await client.query('BEGIN');

      // Сначала вычисляем общую сумму заказа
      // ИСПРАВЛЕНО: Используем батчинг вместо N+1 запросов
      const productIds = items.map((item) => item.productId);
      
      // Один запрос для всех товаров
      const productResult = await client.query(
        'SELECT id, price, in_stock, name FROM products WHERE id = ANY($1::int[])',
        [productIds]
      );

      // Создаем Map для быстрого доступа
      const productMap = new Map(
        productResult.rows.map((p) => [p.id, p])
      );

      let total = 0;
      const productPrices = [];

      for (const item of items) {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error(`Товар с ID ${item.productId} не найден`);
        }

        if (!product.in_stock) {
          throw new Error(`Товар "${product.name}" (ID: ${item.productId}) отсутствует на складе`);
        }

        const price = parseFloat(product.price);
        if (isNaN(price) || price <= 0) {
          throw new Error(`Невалидная цена для товара "${product.name}" (ID: ${item.productId})`);
        }

        const itemTotal = price * item.quantity;
        total += itemTotal;

        productPrices.push({
          productId: item.productId,
          quantity: item.quantity,
          price: price,
        });
      }

      // Проверяем, что сумма больше нуля
      if (total <= 0) {
        throw new Error('Сумма заказа должна быть больше нуля');
      }

      // Создаем заказ СРАЗУ с правильной суммой и привязкой к складу
      const orderResult = await client.query(
        `INSERT INTO orders (
          client_id, dark_store_id, phone, address, comment, 
          client_latitude, client_longitude, status, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          req.user.id,
          darkStoreId, // ✅ Привязываем к складу
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

      // Добавляем товары в заказ
      for (const item of productPrices) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.price]
        );
      }

      await client.query('COMMIT');
      
      // 3. ✅ ПОДТВЕРЖДЕНИЕ РЕЗЕРВАЦИИ (товары списаны)
      await inventoryService.confirm(reservation.reservationIds, order.id);
      logger.log(`✅ Резервация подтверждена для заказа ${order.id}`);

      // 4. ✅ ASYNC: Отправка уведомления о создании заказа
      await queueService.addNotification('order_created', userId, {
        orderId: order.id,
        total: order.total,
        itemsCount: items.length
      }, 'critical');
      
      // 5. ✅ ASYNC: Аналитика
      await queueService.addAnalytics('order_created', {
        orderId: order.id,
        userId,
        darkStoreId,
        total: order.total,
        itemsCount: items.length,
        hasCoordinates: !!(latitude && longitude)
      });

      // 6. Диспетчеризуем заказ (асинхронно)
      // Передаем результат проверки зоны, чтобы избежать повторных запросов
      orderDispatcher.dispatchOrder(order.id, zoneCheckResult?.store).catch((err) => {
        logger.error('Ошибка диспетчеризации заказа:', err);
      });

      // 7. Формируем ответ с учетом предупреждений о зоне доставки
      const response = {
        success: true,
        orderId: order.id,
        message: 'Заказ успешно создан!',
        order: {
          ...order,
          total,
        },
        reservation: {
          expiresAt: reservation.expiresAt,
          status: 'confirmed'
        }
      };

      // Добавляем предупреждение, если клиент находится далеко от склада
      if (zoneCheckResult?.warning) {
        response.warning = zoneCheckResult.warning;
        response.deliveryInfo = {
          distance: zoneCheckResult.store?.distance 
            ? parseFloat(zoneCheckResult.store.distance).toFixed(1) 
            : null,
          estimatedTime: 'Доставка может занять больше времени',
        };
      }

      res.status(201).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      
      // ✅ ROLLBACK РЕЗЕРВАЦИИ (вернуть товары на склад)
      if (reservation && reservation.success) {
        await inventoryService.release(reservation.reservationIds);
        logger.log(`⚠️ Резервация отменена из-за ошибки создания заказа`);
      }
      
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Ошибка создания заказа:', error);
    
    // Дополнительная проверка: если ошибка произошла до transaction
    // и резервация была создана - отменяем её
    if (error.reservation && error.reservation.success) {
      await inventoryService.release(error.reservation.reservationIds);
    }
    
    res.status(500).json({ error: error.message || 'Ошибка создания заказа' });
  }
});

/**
 * Получение заказов пользователя
 */
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    let queryText;
    let params;

    if (req.user.role === 'customer') {
      queryText = `
        SELECT 
          o.*,
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price', oi.price
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.client_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'courier') {
      queryText = `
        SELECT o.*
        FROM orders o
        JOIN couriers c ON c.user_id = $1
        WHERE o.courier_id = c.id
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else if (req.user.role === 'picker') {
      queryText = `
        SELECT o.*
        FROM orders o
        JOIN order_pickers op ON op.user_id = $1
        WHERE o.picker_id = op.id
        ORDER BY o.created_at DESC
      `;
      params = [req.user.id];
    } else {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const result = await query(queryText, params);
    res.json({ orders: result.rows });
  } catch (error) {
    logger.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

/**
 * Получение заказа по ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', p.image,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.id = $1
      GROUP BY o.id`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = result.rows[0];

    // Проверка прав доступа
    if (req.user.role === 'customer' && order.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Нет доступа к этому заказу' });
    }

    res.json({ order });
  } catch (error) {
    logger.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

/**
 * Обновление статуса заказа
 */
router.patch('/:id/status', authenticate, requireRole('courier', 'picker', 'admin'), validateUpdateOrderStatus, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Валидация уже выполнена в middleware validateUpdateOrderStatus

    await query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, orderId]
    );

    res.json({ success: true, message: 'Статус обновлен' });
  } catch (error) {
    logger.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});

module.exports = router;


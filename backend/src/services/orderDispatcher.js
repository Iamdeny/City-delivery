/**
 * Сервис диспетчеризации заказов
 * Назначает сборщиков и курьеров на заказы
 * Оптимизирует маршруты доставки
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');
const deliveryConfig = require('../config/delivery');

class OrderDispatcher {
  /**
   * Проверка, находится ли клиент в зоне доставки
   * @returns {Object} { available: boolean, message?: string, details?: Object }
   */
  async checkDeliveryZone(clientLat, clientLng) {
    try {
      // Сначала ищем склад в радиусе доставки
      const inRadiusResult = await query(
        `SELECT * FROM (
          SELECT 
            id, 
            name, 
            latitude, 
            longitude,
            delivery_radius,
            (6371 * acos(
              cos(radians($1)) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians($2)) + 
              sin(radians($1)) * 
              sin(radians(latitude))
            )) AS distance
          FROM dark_stores
          WHERE is_active = true
        ) AS stores_with_distance
        WHERE distance <= delivery_radius / 1000
        ORDER BY distance
        LIMIT 1`,
        [clientLat, clientLng]
      );

      if (inRadiusResult.rows.length > 0) {
        return {
          available: true,
          store: inRadiusResult.rows[0],
        };
      }

      // Если не в радиусе, проверяем максимальное расстояние
      const nearestResult = await query(
        `SELECT 
          id, 
          name, 
          latitude, 
          longitude,
          delivery_radius,
          (6371 * acos(
            cos(radians($1)) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(latitude))
          )) AS distance
        FROM dark_stores
        WHERE is_active = true
        ORDER BY distance
        LIMIT 1`,
        [clientLat, clientLng]
      );

      if (nearestResult.rows.length === 0) {
        return {
          available: false,
          message: 'Нет доступных складов для доставки',
        };
      }

      const nearestStore = nearestResult.rows[0];
      const distanceKm = parseFloat(nearestStore.distance);

      // Если ближайший склад дальше максимального расстояния - отклоняем
      if (distanceKm > deliveryConfig.MAX_DELIVERY_DISTANCE_KM) {
        return {
          available: false,
          message: `Доставка недоступна. Вы находитесь слишком далеко от зоны обслуживания (${distanceKm.toFixed(1)} км). Максимальное расстояние доставки: ${deliveryConfig.MAX_DELIVERY_DISTANCE_KM} км`,
          details: {
            distance: distanceKm,
            maxDistance: deliveryConfig.MAX_DELIVERY_DISTANCE_KM,
            nearestStore: nearestStore.name,
          },
        };
      }

      // Если в пределах максимального расстояния, но вне радиуса склада - разрешаем с предупреждением
      return {
        available: true,
        store: nearestStore,
        warning: `Ближайший склад находится на расстоянии ${distanceKm.toFixed(1)} км. Доставка может занять больше времени.`,
      };
    } catch (error) {
      logger.error('Ошибка проверки зоны доставки:', error);
      // В случае ошибки разрешаем заказ (можно изменить на false для строгой проверки)
      return {
        available: true,
        warning: 'Не удалось проверить зону доставки',
      };
    }
  }
  /**
   * Назначение склада для заказа (по геолокации клиента)
   */
  async assignDarkStore(orderId, clientLat, clientLng) {
    try {
      // Находим ближайший активный склад в радиусе доставки
      // Используем подзапрос для вычисления distance и фильтрации
      const result = await query(
        `SELECT * FROM (
          SELECT 
            id, 
            name, 
            latitude, 
            longitude,
            delivery_radius,
            (6371 * acos(
              cos(radians($1)) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians($2)) + 
              sin(radians($1)) * 
              sin(radians(latitude))
            )) AS distance
          FROM dark_stores
          WHERE is_active = true
        ) AS stores_with_distance
        WHERE distance <= delivery_radius / 1000
        ORDER BY distance
        LIMIT 1`,
        [clientLat, clientLng]
      );

      let store;
      
      if (result.rows.length === 0) {
        // Если склад не найден в радиусе, берем ближайший склад (но только если в пределах MAX_DELIVERY_DISTANCE_KM)
        logger.warn(`Склад не найден в радиусе доставки для заказа ${orderId}, ищем ближайший склад`);
        const fallbackResult = await query(
          `SELECT 
            id, 
            name, 
            latitude, 
            longitude,
            delivery_radius,
            (6371 * acos(
              cos(radians($1)) * 
              cos(radians(latitude)) * 
              cos(radians(longitude) - radians($2)) + 
              sin(radians($1)) * 
              sin(radians(latitude))
            )) AS distance
          FROM dark_stores
          WHERE is_active = true
          ORDER BY distance
          LIMIT 1`,
          [clientLat, clientLng]
        );
        
        if (fallbackResult.rows.length === 0) {
          throw new Error('Нет доступных складов');
        }
        
        const nearestStore = fallbackResult.rows[0];
        const distanceKm = parseFloat(nearestStore.distance);
        
        // Проверяем максимальное расстояние
        if (distanceKm > deliveryConfig.MAX_DELIVERY_DISTANCE_KM) {
          throw new Error(`Ближайший склад находится слишком далеко (${distanceKm.toFixed(1)} км). Максимальное расстояние: ${deliveryConfig.MAX_DELIVERY_DISTANCE_KM} км`);
        }
        
        store = nearestStore;
        logger.warn(`Назначен ближайший склад ${store.name} (${store.distance.toFixed(2)} км) вне радиуса доставки, но в пределах максимального расстояния`);
      } else {
        store = result.rows[0];
      }

      // Обновляем заказ
      await query(
        'UPDATE orders SET dark_store_id = $1 WHERE id = $2',
        [store.id, orderId]
      );

      logger.log(`Заказ ${orderId} назначен на склад ${store.name} (${store.distance.toFixed(2)} км)`);

      return store;
    } catch (error) {
      logger.error('Ошибка назначения склада:', error);
      throw error;
    }
  }

  /**
   * Назначение сборщика на заказ
   */
  async assignPicker(orderId) {
    try {
      // Получаем информацию о заказе
      const orderResult = await query(
        'SELECT dark_store_id, created_at FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Заказ не найден');
      }

      const order = orderResult.rows[0];

      // Находим свободного сборщика на этом складе
      const pickerResult = await query(
        `SELECT 
          op.id, 
          op.user_id,
          op.performance_rating,
          COUNT(o.id) as current_orders
        FROM order_pickers op
        LEFT JOIN orders o ON o.picker_id = op.id AND o.status IN ('preparing', 'picking')
        WHERE op.dark_store_id = $1 
          AND op.is_active = true
          AND (op.current_order_id IS NULL OR op.current_order_id = $2)
        GROUP BY op.id, op.user_id, op.performance_rating
        ORDER BY current_orders ASC, op.performance_rating DESC
        LIMIT 1`,
        [order.dark_store_id, orderId]
      );

      if (pickerResult.rows.length === 0) {
        throw new Error('Нет доступных сборщиков');
      }

      const picker = pickerResult.rows[0];

      // Назначаем сборщика
      await query(
        'UPDATE orders SET picker_id = $1, status = $2 WHERE id = $3',
        [picker.id, 'preparing', orderId]
      );

      await query(
        'UPDATE order_pickers SET current_order_id = $1 WHERE id = $2',
        [orderId, picker.id]
      );

      logger.log(`Заказ ${orderId} назначен сборщику ${picker.id}`);

      return picker;
    } catch (error) {
      logger.error('Ошибка назначения сборщика:', error);
      throw error;
    }
  }

  /**
   * Назначение курьера на заказ
   */
  async assignCourier(orderId, storeLat, storeLng) {
    try {
      // Находим ближайшего свободного курьера
      const courierResult = await query(
        `SELECT 
          c.id,
          c.user_id,
          c.current_location_lat,
          c.current_location_lng,
          c.rating,
          (6371 * acos(
            cos(radians($1)) * 
            cos(radians(c.current_location_lat)) * 
            cos(radians(c.current_location_lng) - radians($2)) + 
            sin(radians($1)) * 
            sin(radians(c.current_location_lat))
          )) AS distance
        FROM couriers c
        WHERE c.is_active = true
          AND c.current_order_id IS NULL
          AND c.current_location_lat IS NOT NULL
          AND c.current_location_lng IS NOT NULL
        ORDER BY distance ASC
        LIMIT 1`,
        [storeLat, storeLng]
      );

      if (courierResult.rows.length === 0) {
        throw new Error('Нет доступных курьеров');
      }

      const courier = courierResult.rows[0];

      // Назначаем курьера
      await query(
        'UPDATE orders SET courier_id = $1, status = $2 WHERE id = $3',
        [courier.id, 'assigned_to_courier', orderId]
      );

      await query(
        'UPDATE couriers SET current_order_id = $1 WHERE id = $2',
        [orderId, courier.id]
      );

      logger.log(`Заказ ${orderId} назначен курьеру ${courier.id} (${courier.distance.toFixed(2)} км)`);

      return courier;
    } catch (error) {
      logger.error('Ошибка назначения курьера:', error);
      throw error;
    }
  }

  /**
   * Оптимизация маршрута для курьера (несколько заказов)
   */
  async optimizeRoute(courierId, orderIds) {
    // TODO: Интеграция с API маршрутизации (Google Maps, Yandex Maps)
    // Пока возвращаем порядок по расстоянию
    return orderIds;
  }

  /**
   * Автоматическая диспетчеризация нового заказа
   * @param {number} orderId - ID заказа
   * @param {Object} preCheckedStore - Результат проверки зоны доставки (если уже проверялась)
   */
  async dispatchOrder(orderId, preCheckedStore = null) {
    try {
      // 1. Получаем информацию о заказе
      const orderResult = await query(
        `SELECT 
          o.id,
          o.client_latitude,
          o.client_longitude,
          o.dark_store_id,
          ds.latitude as store_lat,
          ds.longitude as store_lng
        FROM orders o
        LEFT JOIN dark_stores ds ON ds.id = o.dark_store_id
        WHERE o.id = $1`,
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Заказ не найден');
      }

      const order = orderResult.rows[0];

      // 2. Назначаем склад (если еще не назначен)
      if (!order.dark_store_id) {
        // Если склад уже был определен при проверке зоны - используем его
        if (preCheckedStore && preCheckedStore.id) {
          await query(
            'UPDATE orders SET dark_store_id = $1 WHERE id = $2',
            [preCheckedStore.id, orderId]
          );
          logger.log(`Заказ ${orderId} назначен на склад ${preCheckedStore.name} (из проверки зоны)`);
        } else if (order.client_latitude && order.client_longitude) {
          try {
            await this.assignDarkStore(
              orderId,
              order.client_latitude,
              order.client_longitude
            );
          } catch (error) {
            // Если не удалось назначить склад по геолокации, назначаем первый активный склад
            logger.warn(`Не удалось назначить склад по геолокации для заказа ${orderId}, назначаем склад по умолчанию`);
            const defaultStore = await query(
              'SELECT id FROM dark_stores WHERE is_active = true LIMIT 1'
            );
            if (defaultStore.rows.length > 0) {
              await query(
                'UPDATE orders SET dark_store_id = $1 WHERE id = $2',
                [defaultStore.rows[0].id, orderId]
              );
            } else {
              logger.error('Нет активных складов для назначения');
            }
          }
        } else {
          // Если нет геолокации, назначаем первый активный склад
          const defaultStore = await query(
            'SELECT id FROM dark_stores WHERE is_active = true LIMIT 1'
          );
          if (defaultStore.rows.length > 0) {
            await query(
              'UPDATE orders SET dark_store_id = $1 WHERE id = $2',
              [defaultStore.rows[0].id, orderId]
            );
          }
        }
      }

      // 3. Назначаем сборщика (если есть склад)
      const updatedOrder = await query(
        'SELECT dark_store_id FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (updatedOrder.rows[0]?.dark_store_id) {
        try {
          await this.assignPicker(orderId);
        } catch (error) {
          // Если нет доступных сборщиков, заказ остается без сборщика
          logger.warn(`Не удалось назначить сборщика для заказа ${orderId}: ${error.message}`);
        }
      }

      logger.log(`Заказ ${orderId} успешно диспетчеризован`);

      return { success: true, orderId };
    } catch (error) {
      logger.error('Ошибка диспетчеризации заказа:', error);
      throw error;
    }
  }
}

module.exports = new OrderDispatcher();


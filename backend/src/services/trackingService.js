module.exports = {
  // Радиусы геозон (метры)
  GEOFENCE_ZONES: {
    APPROACHING_STORE: 500,
    AT_STORE: 100,
    APPROACHING_CLIENT: 500,
    AT_CLIENT: 100,
    DEPARTED_STORE: 200,
  },

  // Средняя скорость для разных типов транспорта (метров в минуту)
  AVERAGE_SPEED: {
    foot: 80, // пешком ~5 км/ч
    bike: 200, // велосипед ~12 км/ч
    car: 400, // автомобиль ~24 км/ч (в городе)
    default: 100, // по умолчанию
  },

  // Интервалы обновления ETA (секунды)
  ETA_UPDATE_INTERVALS: {
    FAST: 10, // <5 мин
    NORMAL: 30, // 5-15 мин
    SLOW: 60, // >15 мин
  },

  // Минимальная точность GPS для обработки (метры)
  MIN_ACCURACY: 100, // игнорировать обновления с точностью хуже 100 м

  // Время жизни кэша позиции в Redis (секунды)
  COURIER_POSITION_TTL: 60 * 5, // 5 минут

  // Время жизни блокировок геозон (секунды) - чтобы не блокировать вечно
  GEOFENCE_LOCK_TTL: 10,
};

/**
 * Real-time Courier Tracking Service (улучшенная версия)
 * Паттерн: Uber Eats / DoorDash Live Tracking
 *
 * Изменения:
 * - Redis для кэша и распределённых блокировок
 * - Валидация входных данных
 * - Асинхронная запись истории
 * - Троттлинг ETA
 * - Учёт типа транспорта
 * - Единый формат ответов
 */

const { query } = require('../config/database');
const logger = require('../utils/logger');
const queueService = require('./queueService');
const redisClient = require('../config/redis'); // предполагаем, что клиент Redis настроен
const config = require('../config/tracking');

// Константы из конфига
const {
  GEOFENCE_ZONES,
  AVERAGE_SPEED,
  ETA_UPDATE_INTERVALS,
  MIN_ACCURACY,
  COURIER_POSITION_TTL,
  GEOFENCE_LOCK_TTL,
} = config;

// Ключи Redis
const redisKeys = {
  courierPosition: (courierId) => `courier:${courierId}:position`,
  courierLastUpdate: (courierId) => `courier:${courierId}:lastUpdate`,
  geofenceLock: (orderId, event) => `geofence:${orderId}:lock:${event}`,
  etaLastUpdate: (orderId) => `eta:${orderId}:lastUpdate`,
};

class TrackingService {
  constructor() {
    // Redis клиент уже должен быть инициализирован
    logger.info('✅ TrackingService с Redis инициализирован');
  }

  /**
   * Валидация координат
   */
  _validateCoordinates(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * Обновить позицию курьера
   * @param {number} courierId - ID курьера
   * @param {number} latitude - Широта
   * @param {number} longitude - Долгота
   * @param {number} accuracy - Точность GPS (метры)
   */
  async updateCourierLocation(courierId, latitude, longitude, accuracy = null) {
    try {
      // 1. Валидация
      if (!courierId || !this._validateCoordinates(latitude, longitude)) {
        return { success: false, error: 'Некорректные входные данные' };
      }
      if (accuracy && accuracy > MIN_ACCURACY) {
        logger.warn(
          `📍 Точность GPS слишком низкая (${accuracy}м) для курьера ${courierId}, обновление проигнорировано`
        );
        return { success: false, error: 'Низкая точность GPS' };
      }

      const timestamp = new Date().toISOString();

      // 2. Сохраняем в Redis (быстрый кэш)
      const positionData = {
        latitude,
        longitude,
        accuracy,
        timestamp,
      };
      await redisClient.setex(
        redisKeys.courierPosition(courierId),
        COURIER_POSITION_TTL,
        JSON.stringify(positionData)
      );

      // 3. Получаем текущий заказ курьера (из БД)
      const orderResult = await query(
        `SELECT o.id, o.client_id, o.status, o.client_latitude, o.client_longitude,
                d.latitude as store_lat, d.longitude as store_lng,
                c.vehicle_type
         FROM orders o
         LEFT JOIN dark_stores d ON o.dark_store_id = d.id
         JOIN couriers c ON c.id = o.courier_id
         WHERE o.courier_id = $1 AND o.status IN ('assigned_to_courier', 'picked_up', 'delivering')
         LIMIT 1`,
        [courierId]
      );

      if (orderResult.rows.length === 0) {
        // Нет активного заказа — только обновили позицию
        logger.info(
          `📍 Позиция курьера ${courierId} обновлена (нет активного заказа)`
        );
        return { success: true, data: { position: positionData } };
      }

      const order = orderResult.rows[0];

      // 4. Асинхронно сохраняем историю перемещений (через очередь, чтобы не блокировать ответ)
      queueService.addJob('saveLocationHistory', {
        courierId,
        orderId: order.id,
        latitude,
        longitude,
        accuracy,
        timestamp,
      });

      // 5. Проверяем геозоны (с использованием Redis для атомарности)
      await this._checkGeofences(courierId, order, latitude, longitude);

      // 6. Обновляем ETA (с троттлингом)
      await this._updateETA(order, latitude, longitude);

      logger.info(
        `📍 Позиция курьера ${courierId} обновлена для заказа ${order.id}`
      );

      return {
        success: true,
        data: {
          position: positionData,
          orderId: order.id,
        },
      };
    } catch (error) {
      logger.error(`❌ Ошибка обновления позиции курьера ${courierId}:`, error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Проверка геозон с атомарными блокировками через Redis
   */
  async _checkGeofences(courierId, order, currentLat, currentLng) {
    const {
      id: orderId,
      client_id: clientId,
      status,
      store_lat,
      store_lng,
      client_latitude,
      client_longitude,
    } = order;

    // Проверка наличия координат
    if (status === 'assigned_to_courier' && (!store_lat || !store_lng)) {
      logger.warn(
        `⚠️ Заказ ${orderId} не имеет координат склада, пропускаем геозоны`
      );
      return;
    }
    if (
      (status === 'picked_up' || status === 'delivering') &&
      (!client_latitude || !client_longitude)
    ) {
      logger.warn(
        `⚠️ Заказ ${orderId} не имеет координат клиента, пропускаем геозоны`
      );
      return;
    }

    // Функция для атомарной отправки уведомления
    const sendNotificationOnce = async (
      eventType,
      data,
      priority = 'normal'
    ) => {
      const lockKey = redisKeys.geofenceLock(orderId, eventType);
      // Пытаемся установить блокировку (если ключа нет)
      const lockAcquired = await redisClient.set(
        lockKey,
        'locked',
        'NX',
        'EX',
        GEOFENCE_LOCK_TTL
      );
      if (lockAcquired) {
        await queueService.addNotification(eventType, clientId, data, priority);
        logger.log(
          `🔔 Уведомление ${eventType} отправлено для заказа ${orderId}`
        );
      } else {
        logger.log(
          `⏭️ Уведомление ${eventType} уже отправлялось ранее для заказа ${orderId}`
        );
      }
    };

    if (status === 'assigned_to_courier') {
      const distanceToStore = this.calculateDistance(
        currentLat,
        currentLng,
        store_lat,
        store_lng
      );

      if (distanceToStore <= GEOFENCE_ZONES.APPROACHING_STORE) {
        await sendNotificationOnce('courier_approaching_store', {
          orderId,
          courierId,
          distance: Math.round(distanceToStore),
        });
      }
      if (distanceToStore <= GEOFENCE_ZONES.AT_STORE) {
        await sendNotificationOnce('courier_at_store', {
          orderId,
          courierId,
        });
      }
    }

    if (status === 'picked_up' || status === 'delivering') {
      const distanceToClient = this.calculateDistance(
        currentLat,
        currentLng,
        client_latitude,
        client_longitude
      );

      // Выехал со склада
      const distanceFromStore = this.calculateDistance(
        currentLat,
        currentLng,
        store_lat,
        store_lng
      );
      if (distanceFromStore >= GEOFENCE_ZONES.DEPARTED_STORE) {
        await sendNotificationOnce(
          'courier_departed_store',
          {
            orderId,
            courierId,
            estimatedMinutes: Math.round(
              distanceToClient / this._getSpeed(order.vehicle_type)
            ),
          },
          'critical'
        );
      }

      if (distanceToClient <= GEOFENCE_ZONES.APPROACHING_CLIENT) {
        await sendNotificationOnce(
          'courier_approaching',
          {
            orderId,
            courierId,
            distance: Math.round(distanceToClient),
            estimatedMinutes: Math.round(
              distanceToClient / this._getSpeed(order.vehicle_type)
            ),
          },
          'critical'
        );
      }

      if (distanceToClient <= GEOFENCE_ZONES.AT_CLIENT) {
        await sendNotificationOnce(
          'courier_arrived',
          {
            orderId,
            courierId,
          },
          'critical'
        );
      }
    }
  }

  /**
   * Получить скорость для типа транспорта (м/мин)
   */
  _getSpeed(vehicleType) {
    return AVERAGE_SPEED[vehicleType] || AVERAGE_SPEED.default;
  }

  /**
   * Обновить ETA с троттлингом
   */
  async _updateETA(order, courierLat, courierLng) {
    const {
      id: orderId,
      client_latitude: clientLat,
      client_longitude: clientLng,
      vehicle_type,
    } = order;
    if (!clientLat || !clientLng) return;

    // Проверяем, когда последний раз обновляли ETA
    const lastUpdateKey = redisKeys.etaLastUpdate(orderId);
    const lastUpdate = await redisClient.get(lastUpdateKey);
    const now = Date.now();

    if (lastUpdate && now - parseInt(lastUpdate) < 5000) {
      // не чаще раза в 5 секунд
      logger.debug(
        `⏱️ ETA для заказа ${orderId} обновлялось недавно, пропускаем`
      );
      return;
    }

    // Обновляем время последнего обновления
    await redisClient.set(lastUpdateKey, now, 'EX', 60); // живёт минуту

    try {
      const distance = this.calculateDistance(
        courierLat,
        courierLng,
        clientLat,
        clientLng
      );
      const speed = this._getSpeed(vehicle_type);
      const estimatedMinutes = Math.ceil(distance / speed);
      const estimatedArrival = new Date(
        Date.now() + estimatedMinutes * 60 * 1000
      );

      await query(
        `UPDATE orders SET estimated_delivery_time = $1 WHERE id = $2`,
        [estimatedArrival, orderId]
      );

      logger.info(
        `⏱️ ETA обновлен для заказа ${orderId}: ${estimatedMinutes} мин (транспорт: ${vehicle_type})`
      );
    } catch (error) {
      logger.error(`❌ Ошибка обновления ETA для заказа ${orderId}:`, error);
    }
  }

  /**
   * Обновление позиции по userId (для роутера)
   */
  async updateCourierLocationByUserId(userId, latitude, longitude, accuracy) {
    try {
      const courierResult = await query(
        'SELECT id FROM couriers WHERE user_id = $1',
        [userId]
      );
      if (courierResult.rows.length === 0) {
        return { success: false, error: 'Профиль курьера не найден' };
      }
      const courierId = courierResult.rows[0].id;
      return await this.updateCourierLocation(
        courierId,
        latitude,
        longitude,
        accuracy
      );
    } catch (error) {
      logger.error('Ошибка в updateCourierLocationByUserId:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Получить информацию о трекинге для клиента
   */
  async getOrderTracking(orderId, userId) {
    try {
      const orderResult = await query(
        `SELECT o.id, o.courier_id, o.status,
                c.current_location_lat, c.current_location_lng, c.last_seen,
                u.name as courier_name
         FROM orders o
         LEFT JOIN couriers c ON o.courier_id = c.id
         LEFT JOIN users u ON c.user_id = u.id
         WHERE o.id = $1 AND o.client_id = $2`,
        [orderId, userId]
      );

      if (orderResult.rows.length === 0) {
        return { success: false, error: 'Заказ не найден' };
      }

      const order = orderResult.rows[0];
      if (!order.courier_id) {
        return {
          success: true,
          data: { tracking: null, message: 'Курьер ещё не назначен' },
        };
      }

      // Пытаемся получить свежую позицию из Redis
      let position = null;
      const cached = await redisClient.get(
        redisKeys.courierPosition(order.courier_id)
      );
      if (cached) {
        position = JSON.parse(cached);
      }

      return {
        success: true,
        data: {
          tracking: {
            courierId: order.courier_id,
            courierName: order.courier_name,
            latitude: position?.latitude || order.current_location_lat,
            longitude: position?.longitude || order.current_location_lng,
            lastUpdate: position?.timestamp || order.last_seen,
            speed: position?.speed, // скорость не сохраняем в Redis, можно пересчитать при необходимости
            accuracy: position?.accuracy,
            status: order.status,
          },
        },
      };
    } catch (error) {
      logger.error('Ошибка получения трекинга заказа:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Получить историю перемещений курьера
   */
  async getCourierHistory(courierId, orderId, limit = 100) {
    try {
      // Предполагаем, что есть таблица courier_location_history
      const history = await query(
        `SELECT latitude, longitude, accuracy, timestamp
         FROM courier_location_history
         WHERE courier_id = $1 AND order_id = $2
         ORDER BY timestamp DESC
         LIMIT $3`,
        [courierId, orderId, limit]
      );
      return { success: true, data: history.rows };
    } catch (error) {
      logger.error('Ошибка получения истории курьера:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Очистить геозоны (если нужно вручную) - в Redis они живут с TTL, так что необязательно
   */
  async clearGeofences(orderId) {
    // Можно удалить ключи блокировок по паттерну, но не обязательно
    logger.info(`🧹 Геозоны для заказа ${orderId} помечены на удаление (TTL)`);
  }

  /**
   * Расчет расстояния между двумя точками (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Получить всех активных курьеров с позициями
   */
  async getActiveCouriers() {
    try {
      const result = await query(
        `SELECT c.id, c.user_id, u.name, c.current_location_lat, c.current_location_lng,
                c.current_order_id, c.vehicle_type, c.last_seen
         FROM couriers c
         JOIN users u ON c.user_id = u.id
         WHERE c.is_active = true AND c.current_order_id IS NOT NULL
         ORDER BY c.last_seen DESC`
      );

      // Обогащаем данными из Redis
      const couriers = await Promise.all(
        result.rows.map(async (courier) => {
          const cached = await redisClient.get(
            redisKeys.courierPosition(courier.id)
          );
          let position = null;
          if (cached) position = JSON.parse(cached);
          return {
            ...courier,
            speed: position?.speed,
            accuracy: position?.accuracy,
            lastSeen: position?.timestamp || courier.last_seen,
          };
        })
      );

      return { success: true, data: couriers };
    } catch (error) {
      logger.error('❌ Ошибка получения активных курьеров:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }
}

// Singleton
let instance = null;
module.exports = () => {
  if (!instance) instance = new TrackingService();
  return instance;
};

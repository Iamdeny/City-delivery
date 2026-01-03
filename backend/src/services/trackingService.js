/**
 * Real-time Courier Tracking Service
 * Паттерн: Uber Eats / DoorDash Live Tracking
 * 
 * Функционал:
 * - Real-time обновление позиции курьера
 * - Geofencing (автоматические уведомления при приближении)
 * - ETA calculation и updates
 * - History tracking для аналитики
 */

const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');
const queueService = require('./queueService');

// Geofencing зоны (метры)
const GEOFENCE_ZONES = {
  APPROACHING_STORE: 500,    // 500м до склада
  AT_STORE: 100,             // 100м - прибыл на склад
  APPROACHING_CLIENT: 500,   // 500м до клиента
  AT_CLIENT: 100,            // 100м - прибыл к клиенту
  DEPARTED_STORE: 200        // 200м - выехал со склада
};

// Интервалы для ETA updates (секунды)
const ETA_UPDATE_INTERVALS = {
  FAST: 10,      // Каждые 10 сек когда < 5 минут до доставки
  NORMAL: 30,    // Каждые 30 сек когда 5-15 минут
  SLOW: 60       // Каждую минуту когда > 15 минут
};

class TrackingService {
  constructor() {
    // Кэш последних известных позиций курьеров (в памяти)
    this.courierPositions = new Map();
    
    // Кэш активных геозон для заказов
    this.activeGeofences = new Map();
    
    logger.log('✅ TrackingService инициализирован');
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
      const timestamp = new Date();
      
      // 1. Сохраняем в БД
      await query(
        `UPDATE couriers 
         SET current_location_lat = $1,
             current_location_lng = $2,
             last_seen = $3
         WHERE id = $4`,
        [latitude, longitude, timestamp, courierId]
      );
      
      // 2. Сохраняем в кэш для быстрого доступа
      const previousPosition = this.courierPositions.get(courierId);
      const newPosition = {
        latitude,
        longitude,
        accuracy,
        timestamp,
        speed: previousPosition ? this.calculateSpeed(previousPosition, { latitude, longitude, timestamp }) : null
      };
      
      this.courierPositions.set(courierId, newPosition);
      
      // 3. Получаем текущий заказ курьера
      const orderResult = await query(
        `SELECT o.id, o.client_id, o.status, o.client_latitude, o.client_longitude,
                d.latitude as store_lat, d.longitude as store_lng
         FROM orders o
         LEFT JOIN dark_stores d ON o.dark_store_id = d.id
         WHERE o.courier_id = $1 AND o.status IN ('assigned_to_courier', 'picked_up', 'delivering')
         LIMIT 1`,
        [courierId]
      );
      
      if (orderResult.rows.length === 0) {
        return { success: true, message: 'Позиция обновлена (нет активного заказа)' };
      }
      
      const order = orderResult.rows[0];
      
      // 4. Проверяем геозоны
      await this.checkGeofences(courierId, order, latitude, longitude);
      
      // 5. Обновляем ETA
      await this.updateETA(order.id, latitude, longitude, order.client_latitude, order.client_longitude);
      
      // 6. Отправляем real-time update через WebSocket
      // (будет обработано в socketHandler.js)
      
      logger.log(`📍 Позиция курьера ${courierId} обновлена: ${latitude}, ${longitude}`);
      
      return {
        success: true,
        position: newPosition,
        orderId: order.id
      };
      
    } catch (error) {
      logger.error('❌ Ошибка обновления позиции курьера:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Проверка геозон и отправка уведомлений
   */
  async checkGeofences(courierId, order, currentLat, currentLng) {
    const orderId = order.id;
    const clientId = order.client_id;
    const status = order.status;
    
    // Получаем или создаем состояние геозон для заказа
    if (!this.activeGeofences.has(orderId)) {
      this.activeGeofences.set(orderId, {
        approachingStore: false,
        atStore: false,
        departedStore: false,
        approachingClient: false,
        atClient: false
      });
    }
    
    const geofenceState = this.activeGeofences.get(orderId);
    
    // Проверяем разные геозоны в зависимости от статуса
    if (status === 'assigned_to_courier') {
      // Курьер едет на склад
      const distanceToStore = this.calculateDistance(
        currentLat,
        currentLng,
        order.store_lat,
        order.store_lng
      );
      
      // Приближается к складу (500м)
      if (distanceToStore <= GEOFENCE_ZONES.APPROACHING_STORE && !geofenceState.approachingStore) {
        geofenceState.approachingStore = true;
        await queueService.addNotification('courier_approaching_store', clientId, {
          orderId,
          courierId,
          distance: Math.round(distanceToStore)
        });
        logger.log(`🚗 Курьер ${courierId} приближается к складу (${Math.round(distanceToStore)}м)`);
      }
      
      // Прибыл на склад (100м)
      if (distanceToStore <= GEOFENCE_ZONES.AT_STORE && !geofenceState.atStore) {
        geofenceState.atStore = true;
        await queueService.addNotification('courier_at_store', clientId, {
          orderId,
          courierId
        });
        logger.log(`📦 Курьер ${courierId} прибыл на склад`);
      }
    }
    
    if (status === 'picked_up' || status === 'delivering') {
      // Курьер едет к клиенту
      const distanceToClient = this.calculateDistance(
        currentLat,
        currentLng,
        order.client_latitude,
        order.client_longitude
      );
      
      // Выехал со склада (200м от склада)
      if (!geofenceState.departedStore) {
        const distanceFromStore = this.calculateDistance(
          currentLat,
          currentLng,
          order.store_lat,
          order.store_lng
        );
        
        if (distanceFromStore >= GEOFENCE_ZONES.DEPARTED_STORE) {
          geofenceState.departedStore = true;
          await queueService.addNotification('courier_departed_store', clientId, {
            orderId,
            courierId,
            estimatedMinutes: Math.round(distanceToClient / 50) // Примерно 50м/мин
          }, 'critical');
          logger.log(`🚗 Курьер ${courierId} выехал со склада к клиенту`);
        }
      }
      
      // Приближается к клиенту (500м)
      if (distanceToClient <= GEOFENCE_ZONES.APPROACHING_CLIENT && !geofenceState.approachingClient) {
        geofenceState.approachingClient = true;
        await queueService.addNotification('courier_approaching', clientId, {
          orderId,
          courierId,
          distance: Math.round(distanceToClient),
          estimatedMinutes: Math.round(distanceToClient / 50)
        }, 'critical');
        logger.log(`🚗 Курьер ${courierId} приближается к клиенту (${Math.round(distanceToClient)}м)`);
      }
      
      // Прибыл к клиенту (100м)
      if (distanceToClient <= GEOFENCE_ZONES.AT_CLIENT && !geofenceState.atClient) {
        geofenceState.atClient = true;
        await queueService.addNotification('courier_arrived', clientId, {
          orderId,
          courierId
        }, 'critical');
        logger.log(`✅ Курьер ${courierId} прибыл к клиенту`);
      }
    }
    
    this.activeGeofences.set(orderId, geofenceState);
  }
  
  /**
   * Обновить ETA (Estimated Time of Arrival)
   */
  async updateETA(orderId, courierLat, courierLng, clientLat, clientLng) {
    try {
      const distance = this.calculateDistance(courierLat, courierLng, clientLat, clientLng);
      
      // Простая формула ETA: расстояние / средняя скорость
      // TODO: В будущем заменить на ML-модель с учетом трафика
      const averageSpeed = 50; // метров в минуту (пешком/велосипед)
      const estimatedMinutes = Math.ceil(distance / averageSpeed);
      const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000);
      
      // Обновляем ETA в БД
      await query(
        `UPDATE orders 
         SET estimated_delivery_time = $1
         WHERE id = $2`,
        [estimatedArrival, orderId]
      );
      
      // Определяем интервал следующего обновления
      let updateInterval;
      if (estimatedMinutes < 5) {
        updateInterval = ETA_UPDATE_INTERVALS.FAST;
      } else if (estimatedMinutes < 15) {
        updateInterval = ETA_UPDATE_INTERVALS.NORMAL;
      } else {
        updateInterval = ETA_UPDATE_INTERVALS.SLOW;
      }
      
      logger.log(`⏱️ ETA обновлен для заказа ${orderId}: ${estimatedMinutes} мин (next update: ${updateInterval}s)`);
      
      return {
        success: true,
        estimatedMinutes,
        estimatedArrival,
        distance,
        updateInterval
      };
      
    } catch (error) {
      logger.error('❌ Ошибка обновления ETA:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Получить историю перемещений курьера
   */
  async getCourierHistory(courierId, orderId, limit = 100) {
    try {
      // TODO: Создать таблицу courier_location_history для хранения истории
      // Пока возвращаем текущую позицию из кэша
      
      const position = this.courierPositions.get(courierId);
      
      return {
        success: true,
        history: position ? [position] : []
      };
      
    } catch (error) {
      logger.error('❌ Ошибка получения истории курьера:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Очистить геозоны для завершенного заказа
   */
  clearGeofences(orderId) {
    this.activeGeofences.delete(orderId);
    logger.log(`🧹 Геозоны очищены для заказа ${orderId}`);
  }
  
  /**
   * Расчет расстояния между двумя точками (Haversine formula)
   * @returns {number} Расстояние в метрах
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Радиус Земли в метрах
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    return distance;
  }
  
  /**
   * Расчет скорости курьера (м/с)
   */
  calculateSpeed(previousPosition, currentPosition) {
    const distance = this.calculateDistance(
      previousPosition.latitude,
      previousPosition.longitude,
      currentPosition.latitude,
      currentPosition.longitude
    );
    
    const timeDiff = (currentPosition.timestamp - previousPosition.timestamp) / 1000; // секунды
    
    if (timeDiff === 0) return 0;
    
    const speed = distance / timeDiff; // м/с
    return Math.round(speed * 100) / 100; // Округляем до 2 знаков
  }
  
  /**
   * Получить все активные курьеры с позициями
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
      
      // Добавляем данные из кэша
      const couriers = result.rows.map(courier => {
        const cachedPosition = this.courierPositions.get(courier.id);
        return {
          ...courier,
          speed: cachedPosition?.speed,
          accuracy: cachedPosition?.accuracy
        };
      });
      
      return { success: true, couriers };
      
    } catch (error) {
      logger.error('❌ Ошибка получения активных курьеров:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let trackingServiceInstance = null;

function getTrackingService() {
  if (!trackingServiceInstance) {
    trackingServiceInstance = new TrackingService();
  }
  return trackingServiceInstance;
}

module.exports = getTrackingService();


/**
 * Push Notification Service
 * Интеграция: Firebase Cloud Messaging (FCM)
 * Паттерн: Uber Eats / DoorDash Push Notifications
 * 
 * Типы уведомлений:
 * - Order updates (создан, принят, готовится, в пути, доставлен)
 * - Courier location (приближается, прибыл)
 * - Promotions (акции, скидки)
 * - System (обновления приложения)
 */

const admin = require('firebase-admin');
const { query } = require('../config/database');
const logger = require('../utils/logger');

// Инициализация Firebase Admin
let fcmInitialized = false;

function initializeFirebase() {
  if (fcmInitialized) return;
  
  try {
    // Проверяем наличие конфигурации
    if (process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
      
      fcmInitialized = true;
      logger.log('✅ Firebase Cloud Messaging инициализирован');
    } else {
      logger.log('⚠️ Firebase не настроен (работаем в dev режиме)');
    }
  } catch (error) {
    logger.error('❌ Ошибка инициализации Firebase:', error);
  }
}

// Шаблоны уведомлений
const NOTIFICATION_TEMPLATES = {
  // Заказ создан
  order_created: {
    title: '✅ Заказ принят!',
    body: (data) => `Заказ #${data.orderId} на сумму ${data.total}₽ принят в обработку`,
    sound: 'default',
    priority: 'high'
  },
  
  // Заказ назначен курьеру
  order_assigned: {
    title: '🚗 Курьер найден!',
    body: (data) => `${data.courierName} заберет ваш заказ #${data.orderId}`,
    sound: 'default',
    priority: 'high'
  },
  
  // Курьер выехал со склада
  courier_departed_store: {
    title: '🚀 Курьер в пути!',
    body: (data) => `Ваш заказ уже везут! Примерно ${data.estimatedMinutes} мин`,
    sound: 'default',
    priority: 'high',
    action: 'TRACK_ORDER'
  },
  
  // Курьер приближается
  courier_approaching: {
    title: '📍 Курьер близко!',
    body: (data) => `Курьер в ${data.distance}м от вас (${data.estimatedMinutes} мин)`,
    sound: 'default',
    priority: 'high',
    action: 'TRACK_ORDER'
  },
  
  // Курьер прибыл
  courier_arrived: {
    title: '🎉 Курьер прибыл!',
    body: 'Ваш заказ у двери. Приятного аппетита!',
    sound: 'default',
    priority: 'high',
    action: 'OPEN_DOOR'
  },
  
  // Заказ доставлен
  order_delivered: {
    title: '✅ Заказ доставлен!',
    body: (data) => `Заказ #${data.orderId} доставлен. Оцените доставку?`,
    sound: 'default',
    priority: 'high',
    action: 'RATE_ORDER'
  },
  
  // Изменение цены в корзине
  price_changed: {
    title: '💰 Изменение цены',
    body: (data) => `Цена ${data.productName} изменилась: ${data.oldPrice}₽ → ${data.newPrice}₽`,
    sound: 'default',
    priority: 'default'
  },
  
  // Товар закончился
  product_unavailable: {
    title: '⚠️ Товар недоступен',
    body: (data) => `${data.productName} закончился. Заменить на похожий?`,
    sound: 'default',
    priority: 'high',
    action: 'SUGGEST_ALTERNATIVE'
  },
  
  // Промо-акция
  promotion: {
    title: (data) => data.title || '🎁 Специальное предложение!',
    body: (data) => data.message,
    sound: 'default',
    priority: 'default',
    action: 'OPEN_PROMO'
  }
};

class PushNotificationService {
  constructor() {
    initializeFirebase();
  }
  
  /**
   * Отправить push-уведомление пользователю
   * @param {number} userId - ID пользователя
   * @param {string} type - Тип уведомления (из NOTIFICATION_TEMPLATES)
   * @param {object} data - Данные для шаблона
   * @param {object} options - Дополнительные опции
   */
  async sendToUser(userId, type, data = {}, options = {}) {
    try {
      // 1. Получить FCM token пользователя из БД
      const tokenResult = await query(
        `SELECT fcm_token FROM users WHERE id = $1 AND fcm_token IS NOT NULL`,
        [userId]
      );
      
      if (tokenResult.rows.length === 0) {
        logger.log(`⚠️ FCM token не найден для user ${userId}`);
        return { success: false, reason: 'NO_TOKEN' };
      }
      
      const fcmToken = tokenResult.rows[0].fcm_token;
      
      // 2. Подготовить notification из шаблона
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        logger.error(`❌ Неизвестный тип уведомления: ${type}`);
        return { success: false, reason: 'UNKNOWN_TYPE' };
      }
      
      const notification = {
        title: typeof template.title === 'function' ? template.title(data) : template.title,
        body: typeof template.body === 'function' ? template.body(data) : template.body
      };
      
      // 3. Подготовить message для FCM
      const message = {
        token: fcmToken,
        notification,
        data: {
          type,
          ...data,
          click_action: template.action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          priority: template.priority || 'high',
          notification: {
            sound: template.sound || 'default',
            channelId: this.getChannelId(type)
          }
        },
        apns: {
          payload: {
            aps: {
              sound: template.sound || 'default',
              badge: 1
            }
          }
        }
      };
      
      // 4. Отправить через FCM
      if (fcmInitialized) {
        const response = await admin.messaging().send(message);
        logger.log(`📬 Push отправлен user ${userId}: ${type} (${response})`);
        
        // 5. Сохранить в БД для истории
        await this.saveNotificationHistory(userId, type, notification, data);
        
        return { success: true, messageId: response };
      } else {
        // Dev режим - эмулируем отправку
        logger.log(`📬 [DEV] Push эмулирован для user ${userId}: ${type}`);
        await this.saveNotificationHistory(userId, type, notification, data);
        return { success: true, dev: true };
      }
      
    } catch (error) {
      logger.error(`❌ Ошибка отправки push user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Отправить push всем пользователям (broadcast)
   */
  async sendToAll(type, data = {}, filter = {}) {
    try {
      // Получить всех пользователей с FCM tokens
      let filterQuery = 'WHERE fcm_token IS NOT NULL';
      const params = [];
      
      if (filter.role) {
        filterQuery += ' AND role = $1';
        params.push(filter.role);
      }
      
      const usersResult = await query(
        `SELECT id, fcm_token FROM users ${filterQuery}`,
        params
      );
      
      if (usersResult.rows.length === 0) {
        logger.log('⚠️ Нет пользователей с FCM tokens');
        return { success: false, reason: 'NO_USERS' };
      }
      
      // Отправить каждому (можно оптимизировать через multicast)
      const results = await Promise.allSettled(
        usersResult.rows.map(user => 
          this.sendToUser(user.id, type, data)
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      logger.log(`📬 Broadcast отправлен: ${successful} успешно, ${failed} ошибок`);
      
      return {
        success: true,
        total: results.length,
        successful,
        failed
      };
      
    } catch (error) {
      logger.error('❌ Ошибка broadcast push:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Сохранить FCM token пользователя
   */
  async registerToken(userId, token) {
    try {
      await query(
        `UPDATE users SET fcm_token = $1 WHERE id = $2`,
        [token, userId]
      );
      
      logger.log(`✅ FCM token сохранен для user ${userId}`);
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Ошибка сохранения FCM token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Удалить FCM token (logout)
   */
  async unregisterToken(userId) {
    try {
      await query(
        `UPDATE users SET fcm_token = NULL WHERE id = $1`,
        [userId]
      );
      
      logger.log(`✅ FCM token удален для user ${userId}`);
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Ошибка удаления FCM token:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Сохранить историю уведомлений
   */
  async saveNotificationHistory(userId, type, notification, data) {
    try {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, type, notification.title, notification.body, JSON.stringify(data)]
      );
    } catch (error) {
      logger.error('❌ Ошибка сохранения истории уведомлений:', error);
    }
  }
  
  /**
   * Получить ID канала уведомлений для Android
   */
  getChannelId(type) {
    if (type.startsWith('order_') || type.startsWith('courier_')) {
      return 'orders';
    } else if (type === 'promotion') {
      return 'promotions';
    } else {
      return 'general';
    }
  }
  
  /**
   * Получить непрочитанные уведомления пользователя
   */
  async getUnreadNotifications(userId, limit = 20) {
    try {
      const result = await query(
        `SELECT id, type, title, message, data, created_at
         FROM notifications
         WHERE user_id = $1 AND is_read = false
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      
      return {
        success: true,
        notifications: result.rows
      };
      
    } catch (error) {
      logger.error('❌ Ошибка получения уведомлений:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId, userId) {
    try {
      await query(
        `UPDATE notifications 
         SET is_read = true 
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
      );
      
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Ошибка отметки уведомления:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let pushServiceInstance = null;

function getPushNotificationService() {
  if (!pushServiceInstance) {
    pushServiceInstance = new PushNotificationService();
  }
  return pushServiceInstance;
}

module.exports = getPushNotificationService();


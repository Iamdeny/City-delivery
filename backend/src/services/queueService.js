/**
 * Message Queue Service
 * Паттерн: Async Processing для High Availability
 * Библиотека: Bull (Redis-based queue)
 * 
 * Используется для:
 * - Отправка уведомлений (email, push, SMS)
 * - Аналитика и логирование
 * - Обработка изображений
 * - Генерация отчетов
 * - Очистка просроченных резерваций
 */

const Queue = require('bull');
const logger = require('../utils/logger');
const pushNotificationService = require('./pushNotificationService');

// Конфигурация Redis для Bull
const REDIS_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
};

// Настройки для разных типов задач
const QUEUE_OPTIONS = {
  // Критические задачи (уведомления о заказах)
  critical: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  },
  
  // Обычные задачи (аналитика)
  normal: {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 5000
    },
    removeOnComplete: 50,
    removeOnFail: 200
  },
  
  // Низкоприоритетные задачи (очистка)
  low: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 10000
    },
    removeOnComplete: 20,
    removeOnFail: 50
  }
};

class QueueService {
  constructor() {
    // Создаем очереди для разных типов задач
    this.queues = {
      notifications: new Queue('notifications', REDIS_CONFIG),
      analytics: new Queue('analytics', REDIS_CONFIG),
      cleanup: new Queue('cleanup', REDIS_CONFIG),
      emails: new Queue('emails', REDIS_CONFIG)
    };
    
    this.setupProcessors();
    this.setupEventHandlers();
    
    logger.log('✅ QueueService инициализирован');
  }
  
  /**
   * Настройка обработчиков задач
   */
  setupProcessors() {
    // Обработчик уведомлений
    this.queues.notifications.process(async (job) => {
      const { type, userId, data } = job.data;
      
      logger.log(`📬 Обработка уведомления: ${type} для user ${userId}`);
      
      // ✅ Отправка через FCM
      const result = await pushNotificationService.sendToUser(userId, type, data);
      
      if (!result.success) {
        logger.error(`❌ Ошибка отправки push: ${result.reason || result.error}`);
        // Выбрасываем ошибку для retry
        if (result.reason !== 'NO_TOKEN') {
          throw new Error(result.error || 'Push notification failed');
        }
      }
      
      return { success: true, processedAt: new Date(), pushResult: result };
    });
    
    // Обработчик аналитики
    this.queues.analytics.process(async (job) => {
      const { event, data } = job.data;
      
      logger.log(`📊 Обработка аналитики: ${event}`);
      
      // Здесь будет сохранение в analytics_daily
      // или отправка в внешние системы (Google Analytics, Mixpanel)
      
      return { success: true, event, timestamp: new Date() };
    });
    
    // Обработчик очистки
    this.queues.cleanup.process(async (job) => {
      const { task } = job.data;
      
      logger.log(`🧹 Выполнение очистки: ${task}`);
      
      if (task === 'expire_reservations') {
        const inventoryService = require('./inventoryService');
        await inventoryService.cleanupExpired();
      }
      
      return { success: true, task, completedAt: new Date() };
    });
    
    // Обработчик email
    this.queues.emails.process(async (job) => {
      const { to, subject, template, data } = job.data;
      
      logger.log(`📧 Отправка email: ${subject} → ${to}`);
      
      // Здесь будет интеграция с SendGrid, AWS SES, или SMTP
      
      return { success: true, to, sentAt: new Date() };
    });
  }
  
  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('completed', (job, result) => {
        logger.log(`✅ [${name}] Задача ${job.id} завершена`);
      });
      
      queue.on('failed', (job, err) => {
        logger.error(`❌ [${name}] Задача ${job.id} провалена:`, err.message);
      });
      
      queue.on('stalled', (job) => {
        logger.log(`⏸️ [${name}] Задача ${job.id} застряла`);
      });
    });
  }
  
  /**
   * Добавить уведомление в очередь
   */
  async addNotification(type, userId, data, priority = 'critical') {
    try {
      const job = await this.queues.notifications.add(
        { type, userId, data },
        {
          ...QUEUE_OPTIONS[priority],
          priority: priority === 'critical' ? 1 : priority === 'normal' ? 2 : 3
        }
      );
      
      logger.log(`📬 Уведомление добавлено в очередь: ${type} (job ${job.id})`);
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('❌ Ошибка добавления уведомления в очередь:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Добавить аналитику в очередь
   */
  async addAnalytics(event, data) {
    try {
      const job = await this.queues.analytics.add(
        { event, data },
        QUEUE_OPTIONS.normal
      );
      
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('❌ Ошибка добавления аналитики в очередь:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Добавить задачу очистки в очередь
   */
  async addCleanupTask(task, delay = 0) {
    try {
      const job = await this.queues.cleanup.add(
        { task },
        {
          ...QUEUE_OPTIONS.low,
          delay
        }
      );
      
      logger.log(`🧹 Задача очистки добавлена: ${task} (job ${job.id})`);
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('❌ Ошибка добавления задачи очистки:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Добавить email в очередь
   */
  async addEmail(to, subject, template, data) {
    try {
      const job = await this.queues.emails.add(
        { to, subject, template, data },
        QUEUE_OPTIONS.normal
      );
      
      logger.log(`📧 Email добавлен в очередь: ${subject} → ${to}`);
      return { success: true, jobId: job.id };
    } catch (error) {
      logger.error('❌ Ошибка добавления email в очередь:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Получить статистику очередей
   */
  async getStats() {
    const stats = {};
    
    for (const [name, queue] of Object.entries(this.queues)) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
      ]);
      
      stats[name] = {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      };
    }
    
    return stats;
  }
  
  /**
   * Настроить повторяющиеся задачи (cron)
   */
  async setupRecurringJobs() {
    // Очистка просроченных резерваций каждые 5 минут
    await this.queues.cleanup.add(
      { task: 'expire_reservations' },
      {
        repeat: {
          cron: '*/5 * * * *' // Каждые 5 минут
        },
        ...QUEUE_OPTIONS.low
      }
    );
    
    logger.log('✅ Повторяющиеся задачи настроены');
  }
  
  
  /**
   * Graceful shutdown
   */
  async close() {
    logger.log('🛑 Закрытие очередей...');
    
    await Promise.all(
      Object.values(this.queues).map(queue => queue.close())
    );
    
    logger.log('✅ Все очереди закрыты');
  }
}

// Singleton instance
let queueServiceInstance = null;

function getQueueService() {
  if (!queueServiceInstance) {
    queueServiceInstance = new QueueService();
  }
  return queueServiceInstance;
}

module.exports = getQueueService();


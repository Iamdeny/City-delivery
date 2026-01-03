/**
 * Redis Cache Service
 * Кэширование для 10x faster queries
 * Паттерн: DoorDash / Instacart
 */

const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.TTL = {
      PRODUCTS: 300,      // 5 minutes
      CATEGORIES: 3600,   // 1 hour
      PRODUCT_DETAIL: 600, // 10 minutes
      INVENTORY: 60,      // 1 minute (часто меняется)
    };
  }

  /**
   * Подключение к Redis
   */
  async connect() {
    if (this.isConnected) {
      return this.client;
    }

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Превышено количество попыток переподключения');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        logger.error('Redis Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.log('✅ Redis подключен');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('⚠️ Redis отключен');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
      
    } catch (error) {
      logger.error('❌ Ошибка подключения к Redis:', error);
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Получить значение из кэша
   * @param {string} key - Ключ
   * @returns {Promise<any|null>}
   */
  async get(key) {
    if (!this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.log(`📦 Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      logger.log(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Ошибка чтения из кэша (${key}):`, error);
      return null;
    }
  }

  /**
   * Сохранить значение в кэш
   * @param {string} key - Ключ
   * @param {any} value - Значение
   * @param {number} ttl - Время жизни (секунды)
   */
  async set(key, value, ttl = 300) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      logger.log(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Ошибка записи в кэш (${key}):`, error);
      return false;
    }
  }

  /**
   * Удалить значение из кэша
   * @param {string} key - Ключ
   */
  async del(key) {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      logger.log(`🗑️ Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Ошибка удаления из кэша (${key}):`, error);
      return false;
    }
  }

  /**
   * Удалить все ключи по паттерну
   * @param {string} pattern - Паттерн (например, "products:*")
   */
  async delPattern(pattern) {
    if (!this.isConnected) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.log(`🗑️ Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error(`Ошибка удаления по паттерну (${pattern}):`, error);
      return false;
    }
  }

  /**
   * Очистить весь кэш
   */
  async flush() {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.client.flushAll();
      logger.log('🗑️ Cache FLUSH: весь кэш очищен');
      return true;
    } catch (error) {
      logger.error('Ошибка очистки кэша:', error);
      return false;
    }
  }

  /**
   * Кэширование с автоматической загрузкой (Cache-Aside Pattern)
   * @param {string} key - Ключ
   * @param {Function} loadFunction - Функция загрузки данных
   * @param {number} ttl - Время жизни
   * @returns {Promise<any>}
   */
  async getOrLoad(key, loadFunction, ttl = 300) {
    // 1. Попытка получить из кэша
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }

    // 2. Загрузить из источника
    try {
      const data = await loadFunction();
      
      // 3. Сохранить в кэш
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error(`Ошибка загрузки данных для кэша (${key}):`, error);
      throw error;
    }
  }

  /**
   * Кэширование продуктов
   */
  async cacheProducts(products, filters = {}) {
    const key = this.getProductsKey(filters);
    return await this.set(key, products, this.TTL.PRODUCTS);
  }

  /**
   * Получить продукты из кэша
   */
  async getProducts(filters = {}) {
    const key = this.getProductsKey(filters);
    return await this.get(key);
  }

  /**
   * Инвалидация кэша продуктов
   */
  async invalidateProducts() {
    return await this.delPattern('products:*');
  }

  /**
   * Кэширование категорий
   */
  async cacheCategories(categories) {
    return await this.set('categories:all', categories, this.TTL.CATEGORIES);
  }

  /**
   * Получить категории из кэша
   */
  async getCategories() {
    return await this.get('categories:all');
  }

  /**
   * Кэширование одного продукта
   */
  async cacheProduct(productId, product) {
    return await this.set(`product:${productId}`, product, this.TTL.PRODUCT_DETAIL);
  }

  /**
   * Получить продукт из кэша
   */
  async getProduct(productId) {
    return await this.get(`product:${productId}`);
  }

  /**
   * Инвалидация одного продукта
   */
  async invalidateProduct(productId) {
    return await this.del(`product:${productId}`);
  }

  /**
   * Кэширование inventory
   */
  async cacheInventory(darkStoreId, productId, inventory) {
    const key = `inventory:${darkStoreId}:${productId}`;
    return await this.set(key, inventory, this.TTL.INVENTORY);
  }

  /**
   * Получить inventory из кэша
   */
  async getInventory(darkStoreId, productId) {
    const key = `inventory:${darkStoreId}:${productId}`;
    return await this.get(key);
  }

  /**
   * Инвалидация inventory
   */
  async invalidateInventory(darkStoreId, productId = null) {
    if (productId) {
      return await this.del(`inventory:${darkStoreId}:${productId}`);
    }
    return await this.delPattern(`inventory:${darkStoreId}:*`);
  }

  /**
   * Генерация ключа для продуктов с учетом фильтров
   * @private
   */
  getProductsKey(filters) {
    const parts = ['products'];
    
    if (filters.category) {
      parts.push(`cat:${filters.category}`);
    }
    if (filters.search) {
      parts.push(`search:${filters.search}`);
    }
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`price:${filters.minPrice || 0}-${filters.maxPrice || 'max'}`);
    }
    if (filters.sort) {
      parts.push(`sort:${filters.sort}`);
    }
    
    return parts.join(':');
  }

  /**
   * Отключение от Redis
   */
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.log('👋 Redis отключен');
    }
  }

  /**
   * Статистика кэша
   */
  async getStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keys: dbSize,
        info: info
      };
    } catch (error) {
      logger.error('Ошибка получения статистики кэша:', error);
      return null;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

// Автоматическое подключение при импорте
cacheService.connect().catch(err => {
  logger.error('Не удалось подключиться к Redis:', err);
});

module.exports = cacheService;


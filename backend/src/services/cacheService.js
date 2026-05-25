const logger = require('../utils/logger');
const config = require('../../config');
const redisClient = require('../config/redis'); // общий клиент Redis

class CacheService {
  constructor() {
    this.client = redisClient;
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
    };

    // TTL из конфига
    this.TTL = {
      PRODUCTS: config.cache?.ttl?.products || 300,
      CATEGORIES: config.cache?.ttl?.categories || 3600,
      PRODUCT_DETAIL: config.cache?.ttl?.productDetail || 600,
      INVENTORY: config.cache?.ttl?.inventory || 60,
    };

    this.client.on('error', (err) => {
      logger.error('Redis client error in CacheService:', err);
      this.stats.errors++;
    });

    logger.info('✅ CacheService инициализирован с общим Redis клиентом');
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value) {
        try {
          const parsed = JSON.parse(value);
          this.stats.hits++;
          logger.debug(`📦 Cache HIT: ${key}`);
          return parsed;
        } catch (parseError) {
          logger.error(`❌ Ошибка парсинга кэша для ключа ${key}:`, parseError);
          await this.del(key);
          this.stats.misses++;
          return null;
        }
      }
      this.stats.misses++;
      logger.debug(`❌ Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Ошибка чтения из кэша (${key}):`, error);
      this.stats.errors++;
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      logger.debug(`✅ Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      logger.error(`Ошибка записи в кэш (${key}):`, error);
      this.stats.errors++;
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      logger.debug(`🗑️ Cache DEL: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Ошибка удаления из кэша (${key}):`, error);
      this.stats.errors++;
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      let cursor = '0';
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          await this.client.del(keys);
          deletedCount += keys.length;
        }
      } while (cursor !== '0');

      logger.debug(`🗑️ Cache DEL pattern: ${pattern} (${deletedCount} keys)`);
      return true;
    } catch (error) {
      logger.error(`Ошибка удаления по паттерну (${pattern}):`, error);
      this.stats.errors++;
      return false;
    }
  }

  async flush() {
    try {
      await this.client.flushall();
      logger.info('🗑️ Cache FLUSH: весь кэш очищен');
      return true;
    } catch (error) {
      logger.error('Ошибка очистки кэша:', error);
      this.stats.errors++;
      return false;
    }
  }

  async getOrLoad(key, loadFunction, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    try {
      const data = await loadFunction();
      await this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error(`Ошибка загрузки данных для кэша (${key}):`, error);
      throw error;
    }
  }

  // ========== Специализированные методы ==========

  async cacheProducts(products, filters = {}) {
    const key = this.getProductsKey(filters);
    return await this.set(key, products, this.TTL.PRODUCTS);
  }

  async getProducts(filters = {}) {
    const key = this.getProductsKey(filters);
    return await this.get(key);
  }

  async invalidateProducts() {
    return await this.delPattern('products:*');
  }

  async cacheCategories(categories) {
    return await this.set('categories:all', categories, this.TTL.CATEGORIES);
  }

  async getCategories() {
    return await this.get('categories:all');
  }

  async cacheProduct(productId, product) {
    return await this.set(
      `product:${productId}`,
      product,
      this.TTL.PRODUCT_DETAIL
    );
  }

  async getProduct(productId) {
    return await this.get(`product:${productId}`);
  }

  async invalidateProduct(productId) {
    return await this.del(`product:${productId}`);
  }

  async cacheInventory(darkStoreId, productId, inventory) {
    const key = `inventory:${darkStoreId}:${productId}`;
    return await this.set(key, inventory, this.TTL.INVENTORY);
  }

  async getInventory(darkStoreId, productId) {
    const key = `inventory:${darkStoreId}:${productId}`;
    return await this.get(key);
  }

  async invalidateInventory(darkStoreId, productId = null) {
    if (productId) {
      return await this.del(`inventory:${darkStoreId}:${productId}`);
    }
    return await this.delPattern(`inventory:${darkStoreId}:*`);
  }

  getProductsKey(filters) {
    const parts = ['products'];
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = filters[key];
        return acc;
      }, {});

    for (const [key, value] of Object.entries(sortedFilters)) {
      if (value !== undefined && value !== null) {
        parts.push(`${key}:${value}`);
      }
    }
    return parts.join(':');
  }

  getStats() {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      errors: this.stats.errors,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? (this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(4)
          : 0,
    };
  }
}

// Экспортируем синглтон-инстанс, чтобы require('./cacheService') возвращал объект сервиса
const cacheServiceInstance = new CacheService();
module.exports = cacheServiceInstance;

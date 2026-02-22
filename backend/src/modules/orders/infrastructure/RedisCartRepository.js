const CartRepository = require('../application/ports/CartRepository');
const Cart = require('../domain/Cart');
const cacheService = require('../../../services/cacheService'); // Re-using existing cacheService
const logger = require('../../../utils/logger');

// TTL for cart in Redis (7 days)
const CART_TTL = 7 * 24 * 60 * 60;

class RedisCartRepository extends CartRepository {
  constructor() {
    super();
    this.cacheService = cacheService;
    this.logger = logger;
  }

  async getByUserId(userId) {
    try {
      const cacheKey = `cart:${userId}`;
      const cachedCartData = await this.cacheService.get(cacheKey);

      if (cachedCartData) {
        this.logger.log(`🛒 Cart for user ${userId} retrieved from cache.`);
        // Reconstruct Cart domain object from plain data
        return new Cart(
          userId,
          cachedCartData.items,
          new Date(cachedCartData.updatedAt)
        );
      }
      return null;
    } catch (error) {
      this.logger.error('❌ Error getting cart from Redis:', error);
      throw new Error(`Failed to retrieve cart: ${error.message}`);
    }
  }

  async save(cart) {
    try {
      const cacheKey = `cart:${cart.userId}`;
      // Convert Cart domain object to plain object for persistence
      const plainCart = cart.toObject();
      await this.cacheService.set(cacheKey, plainCart, CART_TTL);
      this.logger.log(`🛒 Cart for user ${cart.userId} saved to Redis.`);
    } catch (error) {
      this.logger.error('❌ Error saving cart to Redis:', error);
      throw new Error(`Failed to save cart: ${error.message}`);
    }
  }

  async deleteByUserId(userId) {
    try {
      const cacheKey = `cart:${userId}`;
      await this.cacheService.del(cacheKey);
      this.logger.log(`🛒 Cart for user ${userId} deleted from Redis.`);
    } catch (error) {
      this.logger.error('❌ Error deleting cart from Redis:', error);
      throw new Error(`Failed to delete cart: ${error.message}`);
    }
  }
}

module.exports = RedisCartRepository;

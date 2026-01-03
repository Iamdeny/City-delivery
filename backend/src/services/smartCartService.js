/**
 * Smart Cart Service
 * Паттерн: Instacart / Amazon Fresh Smart Cart
 * 
 * Функционал:
 * - Real-time price sync (обновление цен в корзине)
 * - Stock availability check (проверка наличия)
 * - Alternative suggestions (замена недоступных товаров)
 * - Price change notifications
 * - Auto-save cart (сохранение корзины)
 */

const { query, getClient } = require('../config/database');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');
const queueService = require('./queueService');

// TTL для корзины в Redis (7 дней)
const CART_TTL = 7 * 24 * 60 * 60;

class SmartCartService {
  /**
   * Получить корзину пользователя
   */
  async getCart(userId) {
    try {
      // 1. Пытаемся получить из кэша
      const cacheKey = `cart:${userId}`;
      const cachedCart = await cacheService.get(cacheKey);
      
      if (cachedCart) {
        logger.log(`🛒 Корзина user ${userId} из кэша`);
        
        // Проверяем актуальность цен и наличия
        const syncedCart = await this.syncCartPrices(cachedCart);
        return { success: true, cart: syncedCart, fromCache: true };
      }
      
      // 2. Если нет в кэше - создаем пустую корзину
      const emptyCart = {
        userId,
        items: [],
        total: 0,
        updatedAt: new Date()
      };
      
      await cacheService.set(cacheKey, emptyCart, CART_TTL);
      
      return { success: true, cart: emptyCart };
      
    } catch (error) {
      logger.error('❌ Ошибка получения корзины:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Добавить товар в корзину
   */
  async addItem(userId, productId, quantity = 1, darkStoreId = null) {
    try {
      // 1. Получить текущую корзину
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }
      
      const cart = cartResult.cart;
      
      // 2. Получить информацию о товаре
      const productResult = await query(
        `SELECT p.id, p.name, p.price, p.stock_quantity, p.reserved_quantity, 
                p.in_stock, p.image, p.dark_store_id
         FROM products p
         WHERE p.id = $1 ${darkStoreId ? 'AND p.dark_store_id = $2' : ''}`,
        darkStoreId ? [productId, darkStoreId] : [productId]
      );
      
      if (productResult.rows.length === 0) {
        return { 
          success: false, 
          error: 'PRODUCT_NOT_FOUND',
          message: 'Товар не найден'
        };
      }
      
      const product = productResult.rows[0];
      
      // 3. Проверить доступность
      const availableQuantity = product.stock_quantity - (product.reserved_quantity || 0);
      
      if (!product.in_stock || availableQuantity < quantity) {
        return {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: 'Недостаточно товара на складе',
          available: Math.max(0, availableQuantity)
        };
      }
      
      // 4. Добавить или обновить товар в корзине
      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex !== -1) {
        // Товар уже в корзине - обновляем количество
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (newQuantity > availableQuantity) {
          return {
            success: false,
            error: 'INSUFFICIENT_STOCK',
            message: 'Недостаточно товара на складе',
            available: availableQuantity,
            current: cart.items[existingItemIndex].quantity
          };
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].subtotal = newQuantity * product.price;
      } else {
        // Новый товар - добавляем
        cart.items.push({
          productId: product.id,
          name: product.name,
          price: parseFloat(product.price),
          quantity,
          subtotal: quantity * parseFloat(product.price),
          image: product.image,
          darkStoreId: product.dark_store_id,
          addedAt: new Date()
        });
      }
      
      // 5. Пересчитать total
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date();
      
      // 6. Сохранить в кэш
      const cacheKey = `cart:${userId}`;
      await cacheService.set(cacheKey, cart, CART_TTL);
      
      logger.log(`🛒 Товар ${productId} добавлен в корзину user ${userId}`);
      
      return { success: true, cart };
      
    } catch (error) {
      logger.error('❌ Ошибка добавления товара в корзину:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Удалить товар из корзины
   */
  async removeItem(userId, productId) {
    try {
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }
      
      const cart = cartResult.cart;
      
      // Удаляем товар
      cart.items = cart.items.filter(item => item.productId !== productId);
      
      // Пересчитываем total
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date();
      
      // Сохраняем
      const cacheKey = `cart:${userId}`;
      await cacheService.set(cacheKey, cart, CART_TTL);
      
      logger.log(`🛒 Товар ${productId} удален из корзины user ${userId}`);
      
      return { success: true, cart };
      
    } catch (error) {
      logger.error('❌ Ошибка удаления товара из корзины:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Обновить количество товара
   */
  async updateQuantity(userId, productId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeItem(userId, productId);
      }
      
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }
      
      const cart = cartResult.cart;
      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (itemIndex === -1) {
        return {
          success: false,
          error: 'ITEM_NOT_IN_CART',
          message: 'Товар не найден в корзине'
        };
      }
      
      // Проверяем доступность
      const productResult = await query(
        `SELECT stock_quantity, reserved_quantity FROM products WHERE id = $1`,
        [productId]
      );
      
      if (productResult.rows.length > 0) {
        const product = productResult.rows[0];
        const availableQuantity = product.stock_quantity - (product.reserved_quantity || 0);
        
        if (quantity > availableQuantity) {
          return {
            success: false,
            error: 'INSUFFICIENT_STOCK',
            available: availableQuantity
          };
        }
      }
      
      // Обновляем количество
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].subtotal = quantity * cart.items[itemIndex].price;
      
      // Пересчитываем total
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date();
      
      // Сохраняем
      const cacheKey = `cart:${userId}`;
      await cacheService.set(cacheKey, cart, CART_TTL);
      
      return { success: true, cart };
      
    } catch (error) {
      logger.error('❌ Ошибка обновления количества:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Очистить корзину
   */
  async clearCart(userId) {
    try {
      const cacheKey = `cart:${userId}`;
      await cacheService.del(cacheKey);
      
      logger.log(`🛒 Корзина user ${userId} очищена`);
      
      return { success: true };
      
    } catch (error) {
      logger.error('❌ Ошибка очистки корзины:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Синхронизировать цены и наличие товаров в корзине
   * ✅ REAL-TIME PRICE SYNC (Instacart pattern)
   */
  async syncCartPrices(cart) {
    try {
      if (!cart || !cart.items || cart.items.length === 0) {
        return cart;
      }
      
      const productIds = cart.items.map(item => item.productId);
      
      // Получаем актуальные данные из БД
      const productsResult = await query(
        `SELECT id, price, stock_quantity, reserved_quantity, in_stock
         FROM products
         WHERE id = ANY($1::int[])`,
        [productIds]
      );
      
      const productsMap = new Map();
      productsResult.rows.forEach(p => {
        productsMap.set(p.id, p);
      });
      
      let hasChanges = false;
      const priceChanges = [];
      const unavailableItems = [];
      
      // Обновляем каждый товар
      cart.items = cart.items.map(item => {
        const product = productsMap.get(item.productId);
        
        if (!product) {
          unavailableItems.push(item);
          return null; // Товар удален из ассортимента
        }
        
        const newPrice = parseFloat(product.price);
        const oldPrice = item.price;
        
        // Проверяем изменение цены
        if (newPrice !== oldPrice) {
          hasChanges = true;
          priceChanges.push({
            productId: item.productId,
            name: item.name,
            oldPrice,
            newPrice,
            difference: newPrice - oldPrice
          });
          
          item.price = newPrice;
          item.subtotal = item.quantity * newPrice;
        }
        
        // Проверяем доступность
        const availableQuantity = product.stock_quantity - (product.reserved_quantity || 0);
        
        if (!product.in_stock || availableQuantity < item.quantity) {
          hasChanges = true;
          unavailableItems.push({
            ...item,
            available: Math.max(0, availableQuantity)
          });
          
          if (availableQuantity > 0) {
            // Уменьшаем количество до доступного
            item.quantity = availableQuantity;
            item.subtotal = item.quantity * item.price;
          } else {
            return null; // Удаляем из корзины
          }
        }
        
        return item;
      }).filter(item => item !== null);
      
      // Пересчитываем total
      cart.total = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
      cart.updatedAt = new Date();
      
      // Уведомляем пользователя об изменениях
      if (hasChanges) {
        logger.log(`🔄 Корзина user ${cart.userId} обновлена: ${priceChanges.length} цен, ${unavailableItems.length} недоступных`);
        
        cart.hasChanges = true;
        cart.changes = {
          priceChanges,
          unavailableItems
        };
        
        // Отправляем push-уведомление о значительных изменениях
        if (priceChanges.length > 0) {
          const totalDifference = priceChanges.reduce((sum, ch) => sum + ch.difference, 0);
          
          if (Math.abs(totalDifference) > 50) { // Изменение > 50₽
            await queueService.addNotification('cart_price_changed', cart.userId, {
              priceChanges,
              totalDifference: totalDifference.toFixed(2)
            });
          }
        }
        
        if (unavailableItems.length > 0) {
          await queueService.addNotification('cart_items_unavailable', cart.userId, {
            items: unavailableItems.map(i => i.name)
          });
        }
      }
      
      return cart;
      
    } catch (error) {
      logger.error('❌ Ошибка синхронизации корзины:', error);
      return cart; // Возвращаем оригинальную корзину при ошибке
    }
  }
  
  /**
   * Валидация корзины перед checkout
   */
  async validateCart(userId) {
    try {
      const cartResult = await this.getCart(userId);
      if (!cartResult.success) {
        return cartResult;
      }
      
      const cart = cartResult.cart;
      
      if (cart.items.length === 0) {
        return {
          success: false,
          error: 'EMPTY_CART',
          message: 'Корзина пуста'
        };
      }
      
      // Синхронизируем цены и наличие
      const syncedCart = await this.syncCartPrices(cart);
      
      // Проверяем минимальную сумму заказа
      const MIN_ORDER_AMOUNT = 300; // 300₽
      
      if (syncedCart.total < MIN_ORDER_AMOUNT) {
        return {
          success: false,
          error: 'MIN_ORDER_AMOUNT',
          message: `Минимальная сумма заказа ${MIN_ORDER_AMOUNT}₽`,
          current: syncedCart.total,
          required: MIN_ORDER_AMOUNT
        };
      }
      
      // Сохраняем обновленную корзину
      if (syncedCart.hasChanges) {
        const cacheKey = `cart:${userId}`;
        await cacheService.set(cacheKey, syncedCart, CART_TTL);
      }
      
      return {
        success: true,
        cart: syncedCart,
        valid: !syncedCart.hasChanges, // Valid если нет изменений
        changes: syncedCart.changes
      };
      
    } catch (error) {
      logger.error('❌ Ошибка валидации корзины:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let smartCartInstance = null;

function getSmartCartService() {
  if (!smartCartInstance) {
    smartCartInstance = new SmartCartService();
  }
  return smartCartInstance;
}

module.exports = getSmartCartService();


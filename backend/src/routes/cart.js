/**
 * API Routes для Smart Cart
 * Real-time price sync & Stock availability
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const smartCartService = require('../services/smartCartService');
const logger = require('../utils/logger');

/**
 * Получить корзину пользователя
 * GET /api/cart
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await smartCartService.getCart(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка получения корзины:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Добавить товар в корзину
 * POST /api/cart/items
 * Body: { productId, quantity, darkStoreId }
 */
router.post('/items', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, darkStoreId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }
    
    const result = await smartCartService.addItem(userId, productId, quantity, darkStoreId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка добавления в корзину:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Обновить количество товара
 * PUT /api/cart/items/:productId
 * Body: { quantity }
 */
router.put('/items/:productId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;
    
    if (!quantity && quantity !== 0) {
      return res.status(400).json({ error: 'quantity is required' });
    }
    
    const result = await smartCartService.updateQuantity(userId, productId, quantity);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка обновления количества:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Удалить товар из корзины
 * DELETE /api/cart/items/:productId
 */
router.delete('/items/:productId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.productId);
    
    const result = await smartCartService.removeItem(userId, productId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка удаления из корзины:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Очистить корзину
 * DELETE /api/cart
 */
router.delete('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await smartCartService.clearCart(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка очистки корзины:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Валидировать корзину перед checkout
 * POST /api/cart/validate
 */
router.post('/validate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await smartCartService.validateCart(userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Если есть изменения - возвращаем 202 (Accepted with changes)
    if (!result.valid) {
      return res.status(202).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка валидации корзины:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Синхронизировать цены и наличие
 * POST /api/cart/sync
 */
router.post('/sync', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cartResult = await smartCartService.getCart(userId);
    
    if (!cartResult.success) {
      return res.status(400).json(cartResult);
    }
    
    const syncedCart = await smartCartService.syncCartPrices(cartResult.cart);
    
    res.json({
      success: true,
      cart: syncedCart,
      hasChanges: syncedCart.hasChanges || false
    });
    
  } catch (error) {
    logger.error('Ошибка синхронизации корзины:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


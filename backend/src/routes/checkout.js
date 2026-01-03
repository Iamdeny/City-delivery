/**
 * Checkout API Routes
 * Optimized checkout flow with pre-validation
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const checkoutService = require('../services/checkoutService');
const logger = require('../utils/logger');

/**
 * Pre-validate checkout
 * POST /api/checkout/validate
 * Body: { address, phone, latitude, longitude, paymentMethod }
 */
router.post('/validate', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const userId = req.user.id;
    const checkoutData = req.body;

    const validation = await checkoutService.preValidate(userId, checkoutData);

    res.json(validation);

  } catch (error) {
    logger.error('Checkout validation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

/**
 * Process checkout (create order)
 * POST /api/checkout
 * Body: { address, phone, latitude, longitude, paymentMethod, comment }
 */
router.post('/', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const userId = req.user.id;
    const orderData = req.body;

    const result = await checkoutService.processCheckout(userId, orderData);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    logger.error('Checkout processing error:', error);
    res.status(500).json({ 
      success: false,
      error: 'CHECKOUT_FAILED',
      message: 'Ошибка при оформлении заказа'
    });
  }
});

/**
 * Get checkout/order status
 * GET /api/checkout/:orderId/status
 */
router.get('/:orderId/status', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid order ID' 
      });
    }

    const status = await checkoutService.getCheckoutStatus(orderId);

    if (!status.success) {
      return res.status(404).json(status);
    }

    res.json(status);

  } catch (error) {
    logger.error('Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;


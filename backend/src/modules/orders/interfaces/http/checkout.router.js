const express = require('express');
const router = express.Router();

function createCheckoutRouter({
  checkoutService,
  authenticate,
  requireRole,
  logger,
}) {
  /**
   * POST /validate
   * Предварительная валидация заказа
   */
  router.post(
    '/validate',
    authenticate,
    requireRole('customer'),
    async (req, res, next) => {
      try {
        const userId = req.user.id;
        const checkoutData = req.body;

        const validation = await checkoutService.preValidate(userId, checkoutData);
        res.json(validation);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /
   * Оформление заказа
   */
  router.post(
    '/',
    authenticate,
    requireRole('customer'),
    async (req, res, next) => {
      try {
        const userId = req.user.id;
        const orderData = req.body;

        const result = await checkoutService.processCheckout(userId, orderData);

        if (!result.success) {
          return res.status(400).json(result);
        }
        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = { createCheckoutRouter };
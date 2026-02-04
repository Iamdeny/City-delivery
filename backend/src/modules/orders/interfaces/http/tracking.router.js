const express = require('express');
const router = express.Router();

function createTrackingRouter({ trackingService, authenticate, requireRole }) {
  // Обновить позицию курьера (для курьеров)
  router.post(
    '/location',
    authenticate,
    requireRole('courier'),
    async (req, res, next) => {
      try {
        const { latitude, longitude, accuracy } = req.body;
        // Логику получения courierId лучше вынести в сервис или middleware
        // Здесь упрощенно:
        const result = await trackingService.updateCourierLocationByUserId(
          req.user.id,
          latitude,
          longitude,
          accuracy
        );

        if (!result.success) return res.status(400).json(result);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // Трекинг заказа (для клиента)
  router.get('/order/:orderId', authenticate, async (req, res, next) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const result = await trackingService.getOrderTracking(
        orderId,
        req.user.id
      );

      if (!result.success && result.error === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = { createTrackingRouter };

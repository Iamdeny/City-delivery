/**
 * API Routes для Real-time Tracking
 * Courier location updates & Geofencing
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const trackingService = require('../services/trackingService');
const logger = require('../utils/logger');

/**
 * Обновить позицию курьера
 * POST /api/tracking/location
 * Body: { latitude, longitude, accuracy }
 * Только для курьеров
 */
router.post('/location', authenticate, requireRole('courier'), async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    
    // Получить ID курьера из user
    const { query } = require('../config/database');
    const courierResult = await query(
      'SELECT id FROM couriers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (courierResult.rows.length === 0) {
      return res.status(404).json({ error: 'Courier profile not found' });
    }
    
    const courierId = courierResult.rows[0].id;
    
    const result = await trackingService.updateCourierLocation(
      courierId,
      latitude,
      longitude,
      accuracy
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка обновления позиции курьера:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Получить позицию курьера для заказа
 * GET /api/tracking/order/:orderId
 * Клиент может отслеживать свой заказ
 */
router.get('/order/:orderId', authenticate, async (req, res) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const userId = req.user.id;
    
    // Проверить что это заказ пользователя
    const { query } = require('../config/database');
    const orderResult = await query(
      `SELECT o.id, o.courier_id, o.status,
              c.current_location_lat, c.current_location_lng, c.last_seen,
              u.name as courier_name
       FROM orders o
       LEFT JOIN couriers c ON o.courier_id = c.id
       LEFT JOIN users u ON c.user_id = u.id
       WHERE o.id = $1 AND o.client_id = $2`,
      [orderId, userId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (!order.courier_id) {
      return res.json({
        success: true,
        tracking: null,
        message: 'Курьер еще не назначен'
      });
    }
    
    // Получить дополнительную информацию из кэша
    const cachedPosition = trackingService.courierPositions.get(order.courier_id);
    
    res.json({
      success: true,
      tracking: {
        courierId: order.courier_id,
        courierName: order.courier_name,
        latitude: order.current_location_lat,
        longitude: order.current_location_lng,
        lastUpdate: order.last_seen,
        speed: cachedPosition?.speed,
        accuracy: cachedPosition?.accuracy,
        status: order.status
      }
    });
    
  } catch (error) {
    logger.error('Ошибка получения tracking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Получить историю перемещений курьера
 * GET /api/tracking/courier/:courierId/history
 * Только для админов и самого курьера
 */
router.get('/courier/:courierId/history', authenticate, async (req, res) => {
  try {
    const courierId = parseInt(req.params.courierId);
    const limit = parseInt(req.query.limit) || 100;
    
    // Проверка прав доступа
    if (req.user.role !== 'admin') {
      const { query } = require('../config/database');
      const courierCheck = await query(
        'SELECT id FROM couriers WHERE id = $1 AND user_id = $2',
        [courierId, req.user.id]
      );
      
      if (courierCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const result = await trackingService.getCourierHistory(courierId, null, limit);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка получения истории курьера:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Получить всех активных курьеров (админ)
 * GET /api/tracking/couriers/active
 */
router.get('/couriers/active', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await trackingService.getActiveCouriers();
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    logger.error('Ошибка получения активных курьеров:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


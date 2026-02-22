/**
 * Маршруты для работы с заказами
 */

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { query } = require('../config/database');
const orderService = require('../services/orderService');
const logger = require('../utils/logger');
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
} = require('../validators/order.validator');

/**
 * Создание нового заказа (клиент)
 */
router.post('/', authenticate, requireRole('customer'), validateCreateOrder, async (req, res) => {
  try {
    const result = await orderService.createOrder(req.user.id, req.body);
    
    // Формируем ответ с учетом предупреждений о зоне доставки
    const response = {
      success: true,
      orderId: result.order.id,
      message: 'Заказ успешно создан!',
      order: result.order,
      reservation: result.reservation
    };

    if (result.zoneWarning) {
      response.warning = result.zoneWarning;
      response.deliveryInfo = {
        distance: result.distance ? parseFloat(result.distance).toFixed(1) : null,
        estimatedTime: 'Доставка может занять больше времени',
      };
    }

    res.status(201).json(response);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: error.error,
        message: error.message,
        unavailableItems: error.unavailableItems,
        details: error.details
      });
    }
    
    logger.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания заказа' });
  }
});


/**
 * Получение заказов пользователя
 */
router.get('/my-orders', authenticate, async (req, res) => {
  try {
    const orders = await orderService.getUserOrders(req.user.id, req.user.role);
    res.json({ orders });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    logger.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

/**
 * Получение заказа по ID
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user);
    res.json({ order });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    logger.error('Ошибка получения заказа:', error);
    res.status(500).json({ error: 'Ошибка получения заказа' });
  }
});

/**
 * Обновление статуса заказа
 */
router.patch('/:id/status', authenticate, requireRole('courier', 'picker', 'admin'), validateUpdateOrderStatus, async (req, res) => {
  try {
    await orderService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, message: 'Статус обновлен' });
  } catch (error) {
    logger.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса' });
  }
});


module.exports = router;


/**
 * Payment Routes - ЮKassa Integration
 * POST /api/payments/create - Создать платеж
 * GET /api/payments/:paymentId/status - Проверить статус
 * POST /api/payments/webhook - Webhook от ЮKassa
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticate, requireRole } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * Создать платеж для заказа
 * POST /api/payments/create
 * Body: { orderId, amount, description }
 */
router.post('/create', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const { orderId, amount, description } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'orderId и amount обязательны'
      });
    }

    const result = await paymentService.createPayment(
      orderId,
      parseFloat(amount),
      description
    );

    res.json(result);

  } catch (error) {
    logger.error('Ошибка создания платежа:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка создания платежа'
    });
  }
});

/**
 * Проверить статус платежа
 * GET /api/payments/:paymentId/status
 */
router.get('/:paymentId/status', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await paymentService.checkPaymentStatus(paymentId);

    res.json(result);

  } catch (error) {
    logger.error('Ошибка проверки статуса платежа:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка проверки статуса'
    });
  }
});

/**
 * Webhook от ЮKassa
 * POST /api/payments/webhook
 * НЕ требует авторизации (проверка по IP/подписи)
 */
router.post('/webhook', async (req, res) => {
  try {
    // В production: проверка IP whitelist и подписи
    const signature = req.headers['x-yookassa-signature'];
    
    // TODO: Реализовать проверку подписи
    // const isValid = paymentService.verifyWebhookSignature(req.body, signature);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const result = await paymentService.handleWebhook(req.body);

    // ЮKassa ожидает 200 OK
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Ошибка обработки webhook:', error);
    // Все равно возвращаем 200, чтобы ЮKassa не повторял запрос
    res.status(200).json({ received: true, error: error.message });
  }
});

module.exports = router;


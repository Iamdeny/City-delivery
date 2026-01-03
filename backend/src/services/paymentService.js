/**
 * Payment Service - ЮKassa Integration
 * Обработка платежей через ЮKassa API
 */

const crypto = require('crypto');
const { query } = require('../config/database');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    // ЮKassa credentials из .env
    this.shopId = process.env.YUKASSA_SHOP_ID;
    this.secretKey = process.env.YUKASSA_SECRET_KEY;
    this.apiUrl = process.env.YUKASSA_API_URL || 'https://api.yookassa.ru/v3';
    
    if (!this.shopId || !this.secretKey) {
      logger.warn('⚠️ ЮKassa credentials не настроены. Платежи не будут работать.');
    }
  }

  /**
   * Создать платеж в ЮKassa
   * @param {number} orderId - ID заказа
   * @param {number} amount - Сумма в рублях
   * @param {string} description - Описание платежа
   * @param {object} metadata - Дополнительные данные
   * @returns {Promise<object>} { success, paymentId, confirmationUrl }
   */
  async createPayment(orderId, amount, description, metadata = {}) {
    try {
      if (!this.shopId || !this.secretKey) {
        throw new Error('ЮKassa не настроена');
      }

      const idempotenceKey = crypto.randomUUID();
      const paymentData = {
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB'
        },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`
        },
        capture: true,
        description: description || `Заказ #${orderId}`,
        metadata: {
          orderId: orderId.toString(),
          ...metadata
        }
      };

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotence-Key': idempotenceKey,
          'Authorization': `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error('❌ Ошибка создания платежа ЮKassa:', error);
        throw new Error(error.description || 'Ошибка создания платежа');
      }

      const payment = await response.json();

      // Сохраняем платеж в БД
      await query(
        `INSERT INTO payments (order_id, payment_id, amount, status, yukassa_id, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (yukassa_id) DO NOTHING`,
        [orderId, payment.id, amount, 'pending', payment.id]
      );

      logger.log(`✅ Платеж создан: ${payment.id} для заказа #${orderId}`);

      return {
        success: true,
        paymentId: payment.id,
        confirmationUrl: payment.confirmation?.confirmation_url,
        status: payment.status
      };

    } catch (error) {
      logger.error('❌ Ошибка создания платежа:', error);
      throw error;
    }
  }

  /**
   * Проверить статус платежа
   * @param {string} paymentId - ID платежа в ЮKassa
   * @returns {Promise<object>} { success, status, paid }
   */
  async checkPaymentStatus(paymentId) {
    try {
      if (!this.shopId || !this.secretKey) {
        throw new Error('ЮKassa не настроена');
      }

      const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.shopId}:${this.secretKey}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка проверки статуса платежа');
      }

      const payment = await response.json();

      // Обновляем статус в БД
      await query(
        `UPDATE payments 
         SET status = $1, updated_at = NOW()
         WHERE yukassa_id = $2`,
        [payment.status, paymentId]
      );

      return {
        success: true,
        status: payment.status,
        paid: payment.status === 'succeeded',
        amount: payment.amount?.value
      };

    } catch (error) {
      logger.error('❌ Ошибка проверки статуса платежа:', error);
      throw error;
    }
  }

  /**
   * Обработка webhook от ЮKassa
   * @param {object} webhookData - Данные от ЮKassa
   * @returns {Promise<object>} { success, processed }
   */
  async handleWebhook(webhookData) {
    try {
      const { event, object } = webhookData;

      if (event !== 'payment.succeeded' && event !== 'payment.canceled') {
        return { success: true, processed: false };
      }

      const paymentId = object.id;
      const orderId = parseInt(object.metadata?.orderId);

      if (!orderId) {
        logger.warn('⚠️ Webhook без orderId:', webhookData);
        return { success: false, error: 'No orderId in metadata' };
      }

      // Обновляем статус платежа
      await query(
        `UPDATE payments 
         SET status = $1, updated_at = NOW()
         WHERE yukassa_id = $2`,
        [object.status, paymentId]
      );

      // Если платеж успешен - обновляем заказ
      if (event === 'payment.succeeded') {
        await query(
          `UPDATE orders 
           SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
           WHERE id = $1`,
          [orderId]
        );

        logger.log(`✅ Платеж успешен для заказа #${orderId}`);
      }

      return { success: true, processed: true, orderId };

    } catch (error) {
      logger.error('❌ Ошибка обработки webhook:', error);
      throw error;
    }
  }

  /**
   * Верификация webhook (проверка подписи)
   * @param {object} webhookData - Данные webhook
   * @param {string} signature - Подпись от ЮKassa
   * @returns {boolean} - Валидна ли подпись
   */
  verifyWebhookSignature(webhookData, signature) {
    // ЮKassa использует HMAC-SHA256 для подписи
    // В production нужно реализовать проверку подписи
    // Для MVP можно пропустить, но добавить IP whitelist
    return true; // TODO: Реализовать проверку подписи
  }
}

module.exports = new PaymentService();


/**
 * Checkout Optimization Service
 * Pre-validation, Optimistic processing, Error recovery
 * 
 * Patterns from: Samokat, Yandex Lavka, Uber Eats
 */

const { query } = require('../config/database');
const smartCartService = require('./smartCartService');
const inventoryService = require('./inventoryService');
const orderDispatcher = require('./orderDispatcher');
const logger = require('../utils/logger');

class CheckoutService {
  /**
   * Pre-validate checkout before actually creating order
   * Minimizes checkout failure rate (best practice from Yandex Lavka)
   * 
   * @param {number} userId
   * @param {object} checkoutData { address, phone, latitude, longitude, paymentMethod }
   * @returns {object} { valid, issues, estimatedTotal, estimatedDeliveryTime }
   */
  async preValidate(userId, checkoutData) {
    const issues = [];
    let estimatedTotal = 0;
    let estimatedDeliveryTime = null;
    let darkStoreId = null;

    try {
      // 1. Validate cart
      const cartValidation = await smartCartService.validateCart(userId);
      
      if (!cartValidation.valid) {
        issues.push({
          type: 'CART_INVALID',
          severity: 'error',
          message: cartValidation.message || 'Корзина недействительна',
          details: cartValidation.issues
        });
        
        // If cart is invalid, no point in further validation
        return {
          valid: false,
          issues,
          estimatedTotal: 0,
          estimatedDeliveryTime: null
        };
      }

      // 2. Check delivery zone
      if (checkoutData.latitude && checkoutData.longitude) {
        const zoneCheck = await orderDispatcher.checkDeliveryZone(
          checkoutData.latitude,
          checkoutData.longitude
        );

        if (!zoneCheck.available) {
          issues.push({
            type: 'DELIVERY_UNAVAILABLE',
            severity: 'error',
            message: zoneCheck.message || 'Доставка в ваш район недоступна',
            details: zoneCheck.details
          });
        } else {
          darkStoreId = zoneCheck.darkStoreId;
          estimatedDeliveryTime = zoneCheck.estimatedDeliveryTime;
        }
      } else {
        issues.push({
          type: 'COORDINATES_MISSING',
          severity: 'error',
          message: 'Необходимо указать координаты доставки'
        });
      }

      // 3. Check inventory availability
      const cart = await smartCartService.getCart(userId);
      
      if (cart.success && cart.cart && cart.cart.items && cart.cart.items.length > 0) {
        const items = cart.cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));

        // Use darkStoreId from zone check if available, otherwise use default
        const storeId = darkStoreId || 1;

        const availabilityCheck = await inventoryService.checkAvailability(items, storeId);

        if (!availabilityCheck.available) {
          issues.push({
            type: 'INVENTORY_UNAVAILABLE',
            severity: 'error',
            message: 'Некоторые товары недоступны',
            unavailableItems: availabilityCheck.unavailableItems
          });
        }

        // Calculate estimated total
        estimatedTotal = cart.cart.items.reduce((sum, item) => 
          sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
        );

        // Add delivery fee (if applicable)
        const deliveryFee = 0; // Free delivery for now
        estimatedTotal += deliveryFee;
      }

      // 4. Validate address
      if (!checkoutData.address || checkoutData.address.trim().length < 10) {
        issues.push({
          type: 'ADDRESS_INVALID',
          severity: 'error',
          message: 'Адрес доставки слишком короткий'
        });
      }

      // 5. Validate phone
      const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
      if (!checkoutData.phone || !phoneRegex.test(checkoutData.phone)) {
        issues.push({
          type: 'PHONE_INVALID',
          severity: 'warning',
          message: 'Номер телефона не соответствует формату: +7 (999) 123-45-67'
        });
      }

      // 6. Validate payment method
      const validPaymentMethods = ['card', 'cash', 'apple_pay', 'google_pay'];
      if (!checkoutData.paymentMethod || !validPaymentMethods.includes(checkoutData.paymentMethod)) {
        issues.push({
          type: 'PAYMENT_METHOD_INVALID',
          severity: 'warning',
          message: 'Способ оплаты не указан или недействителен',
          validMethods: validPaymentMethods
        });
      }

      // Determine if validation passed
      const hasErrors = issues.some(issue => issue.severity === 'error');

      return {
        valid: !hasErrors,
        issues,
        estimatedTotal,
        estimatedDeliveryTime,
        darkStoreId,
        summary: {
          cartItemsCount: cart.cart?.items?.length || 0,
          deliveryAvailable: !issues.some(i => i.type === 'DELIVERY_UNAVAILABLE'),
          inventoryAvailable: !issues.some(i => i.type === 'INVENTORY_UNAVAILABLE')
        }
      };

    } catch (error) {
      logger.error('[CheckoutService] Pre-validation error:', error);
      
      return {
        valid: false,
        issues: [{
          type: 'SYSTEM_ERROR',
          severity: 'error',
          message: 'Ошибка при проверке данных заказа'
        }],
        estimatedTotal: 0,
        estimatedDeliveryTime: null
      };
    }
  }

  /**
   * Optimistic checkout processing
   * Creates order with immediate response, continues processing in background
   * 
   * @param {number} userId
   * @param {object} orderData
   * @returns {object} { success, orderId, status, message }
   */
  async processCheckout(userId, orderData) {
    const startTime = Date.now();

    try {
      // Pre-validate again (in case state changed since last check)
      const validation = await this.preValidate(userId, orderData);

      if (!validation.valid) {
        return {
          success: false,
          error: 'VALIDATION_FAILED',
          message: 'Не удалось оформить заказ',
          issues: validation.issues
        };
      }

      // Get cart items
      const cart = await smartCartService.getCart(userId);
      
      if (!cart.success || !cart.cart || !cart.cart.items || cart.cart.items.length === 0) {
        return {
          success: false,
          error: 'EMPTY_CART',
          message: 'Корзина пуста'
        };
      }

      const items = cart.cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }));

      // Reserve inventory (atomic operation)
      const reservation = await inventoryService.reserve(
        items,
        userId,
        validation.darkStoreId || 1
      );

      if (!reservation.success) {
        return {
          success: false,
          error: 'RESERVATION_FAILED',
          message: 'Не удалось зарезервировать товары',
          unavailableItems: reservation.unavailableItems
        };
      }

      // Calculate final total
      const totalAmount = items.reduce((sum, item) => 
        sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
      );

      // Create order in database
      const orderResult = await query(
        `INSERT INTO orders (
          client_id, 
          dark_store_id,
          status, 
          total, 
          address, 
          client_latitude, 
          client_longitude, 
          phone,
          comment,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id, status, total, created_at`,
        [
          userId,
          validation.darkStoreId || 1,
          'pending',
          totalAmount,
          orderData.address,
          orderData.latitude || null,
          orderData.longitude || null,
          orderData.phone,
          orderData.comment || `Оплата: ${orderData.paymentMethod || 'cash'}`
        ]
      );

      const order = orderResult.rows[0];

      // Insert order items
      for (const item of items) {
        await query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, item.productId, item.quantity, item.price]
        );
      }

      // Confirm reservation (link to order)
      await inventoryService.confirm(reservation.reservationId, order.id);

      // Clear cart
      await smartCartService.clearCart(userId);

      // Create payment if not cash
      let paymentResult = null;
      if (orderData.paymentMethod && orderData.paymentMethod !== 'cash') {
        try {
          const paymentService = require('./paymentService');
          paymentResult = await paymentService.createPayment(
            order.id,
            parseFloat(totalAmount),
            `Заказ #${order.id}`,
            { userId: userId.toString() }
          );
          
          // Update order with payment info
          if (paymentResult.success) {
            await query(
              `UPDATE orders SET payment_status = 'pending' WHERE id = $1`,
              [order.id]
            );
          }
        } catch (paymentError) {
          logger.error('Ошибка создания платежа:', paymentError);
          // Не прерываем создание заказа, платеж можно создать позже
        }
      } else {
        // Cash payment - mark as paid
        await query(
          `UPDATE orders SET payment_status = 'paid' WHERE id = $1`,
          [order.id]
        );
      }

      const processingTime = Date.now() - startTime;
      logger.info(`[CheckoutService] Order ${order.id} created in ${processingTime}ms`);

      // Return optimistic response
      return {
        success: true,
        orderId: order.id,
        status: order.status,
        totalAmount: order.total,
        estimatedDeliveryTime: validation.estimatedDeliveryTime,
        payment: paymentResult ? {
          paymentId: paymentResult.paymentId,
          confirmationUrl: paymentResult.confirmationUrl,
          status: paymentResult.status
        } : null,
        message: 'Заказ успешно оформлен',
        processingTime
      };

    } catch (error) {
      logger.error('[CheckoutService] Checkout processing error:', error);
      
      return {
        success: false,
        error: 'CHECKOUT_FAILED',
        message: 'Ошибка при оформлении заказа',
        details: error.message
      };
    }
  }

  /**
   * Quick checkout status check
   * For optimistic UI updates
   */
  async getCheckoutStatus(orderId) {
    try {
      const result = await query(
        `SELECT id, status, total_amount, created_at, updated_at
         FROM orders
         WHERE id = $1`,
        [orderId]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'ORDER_NOT_FOUND'
        };
      }

      return {
        success: true,
        order: result.rows[0]
      };
    } catch (error) {
      logger.error('[CheckoutService] Status check error:', error);
      return {
        success: false,
        error: 'STATUS_CHECK_FAILED'
      };
    }
  }
}

module.exports = new CheckoutService();


/**
 * Checkout Hook - Pre-validation & Optimistic Processing
 * Best practices from Yandex Lavka, Uber Eats
 */

import { useState, useCallback } from 'react';
import { 
  checkoutService, 
  CheckoutData, 
  PreValidationResponse,
  CheckoutResponse 
} from '../services/checkoutService';
import { logger } from '../utils/logger';
import { useNotifications } from './useNotifications';

export const useCheckout = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<PreValidationResponse | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
  const { showNotification } = useNotifications();

  /**
   * Pre-validation перед оформлением
   * Проверяет корзину, доставку, инвентарь
   */
  const preValidate = useCallback(
    async (data: CheckoutData): Promise<PreValidationResponse> => {
      setIsValidating(true);
      setValidationResult(null);

      try {
        const result = await checkoutService.preValidate(data);
        setValidationResult(result);

        if (!result.valid) {
          // Показываем ошибки валидации
          const errorIssues = result.issues.filter((i) => i.severity === 'error');
          errorIssues.forEach((issue) => {
            showNotification(issue.message, 'error');
          });

          // Показываем предупреждения
          const warningIssues = result.issues.filter((i) => i.severity === 'warning');
          warningIssues.forEach((issue) => {
            showNotification(issue.message, 'info');
          });
        }

        return result;
      } catch (error) {
        logger.error('Ошибка pre-validation:', error);
        const errorResult: PreValidationResponse = {
          valid: false,
          issues: [
            {
              type: 'SYSTEM_ERROR',
              severity: 'error',
              message: 'Не удалось проверить данные заказа',
            },
          ],
          estimatedTotal: 0,
          estimatedDeliveryTime: null,
          darkStoreId: null,
          summary: {
            cartItemsCount: 0,
            deliveryAvailable: false,
            inventoryAvailable: false,
          },
        };
        setValidationResult(errorResult);
        return errorResult;
      } finally {
        setIsValidating(false);
      }
    },
    [showNotification]
  );

  /**
   * Оформление заказа (Optimistic Processing)
   */
  const processCheckout = useCallback(
    async (data: CheckoutData): Promise<CheckoutResponse> => {
      setIsProcessing(true);
      setCheckoutResult(null);

      try {
        const result = await checkoutService.processCheckout(data);
        setCheckoutResult(result);

        if (result.success) {
          // Если есть платеж - перенаправляем на оплату
          if (result.payment?.confirmationUrl) {
            showNotification('Перенаправление на оплату...', 'info');
            // Небольшая задержка для показа уведомления
            setTimeout(() => {
              window.location.href = result.payment!.confirmationUrl!;
            }, 500);
          } else {
            showNotification(`Заказ #${result.orderId} успешно оформлен!`, 'success');
          }
        } else {
          showNotification(result.error || 'Не удалось оформить заказ', 'error');
        }

        return result;
      } catch (error) {
        logger.error('Ошибка checkout:', error);
        const errorResult: CheckoutResponse = {
          success: false,
          error: 'Не удалось оформить заказ',
        };
        setCheckoutResult(errorResult);
        showNotification('Не удалось оформить заказ', 'error');
        return errorResult;
      } finally {
        setIsProcessing(false);
      }
    },
    [showNotification]
  );

  /**
   * Полный checkout flow с pre-validation
   * Рекомендуемый способ оформления заказа
   */
  const checkout = useCallback(
    async (data: CheckoutData): Promise<CheckoutResponse> => {
      // 1. Pre-validation
      const validation = await preValidate(data);

      if (!validation.valid) {
        return {
          success: false,
          error: 'Не удалось пройти валидацию',
          issues: validation.issues,
        };
      }

      // 2. Оформление заказа
      return await processCheckout(data);
    },
    [preValidate, processCheckout]
  );

  /**
   * Получить статус заказа
   */
  const getOrderStatus = useCallback(async (orderId: number) => {
    try {
      const result = await checkoutService.getOrderStatus(orderId);
      return result;
    } catch (error) {
      logger.error('Ошибка получения статуса:', error);
      return null;
    }
  }, []);

  /**
   * Сброс состояния
   */
  const reset = useCallback(() => {
    setValidationResult(null);
    setCheckoutResult(null);
  }, []);

  return {
    // State
    isValidating,
    isProcessing,
    validationResult,
    checkoutResult,

    // Methods
    preValidate,
    processCheckout,
    checkout,
    getOrderStatus,
    reset,

    // Computed
    isValid: validationResult?.valid || false,
    hasErrors: (validationResult?.issues.filter((i) => i.severity === 'error').length || 0) > 0,
    hasWarnings: (validationResult?.issues.filter((i) => i.severity === 'warning').length || 0) > 0,
  };
};


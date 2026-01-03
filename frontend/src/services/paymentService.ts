/**
 * Payment Service - ЮKassa Integration (Frontend)
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { authService } from './authService';

export interface CreatePaymentRequest {
  orderId: number;
  amount: number;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  confirmationUrl?: string;
  status?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status?: string;
  paid?: boolean;
  amount?: string;
  error?: string;
}

class PaymentService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/payments`;

  /**
   * Создать платеж для заказа
   */
  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      logger.log('💳 Создание платежа:', data);

      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error('❌ Ошибка создания платежа:', result);
        return {
          success: false,
          error: result.error || 'Ошибка создания платежа',
        };
      }

      logger.log(`✅ Платеж создан: ${result.paymentId}`);

      return result;
    } catch (error) {
      logger.error('❌ Ошибка создания платежа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Проверить статус платежа
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/${paymentId}/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Ошибка проверки статуса',
        };
      }

      return result;
    } catch (error) {
      logger.error('❌ Ошибка проверки статуса платежа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Перенаправить на страницу оплаты ЮKassa
   */
  redirectToPayment(confirmationUrl: string): void {
    if (confirmationUrl) {
      window.location.href = confirmationUrl;
    } else {
      logger.error('❌ Нет URL для перенаправления');
    }
  }
}

export const paymentService = new PaymentService();


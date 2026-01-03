/**
 * Checkout Service - Pre-validation & Optimistic Processing
 * Паттерны из Yandex Lavka, Uber Eats
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { authService } from './authService';

export interface CheckoutData {
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  paymentMethod?: 'card' | 'cash' | 'apple_pay' | 'google_pay';
  comment?: string;
}

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning';
  message: string;
  details?: any;
  unavailableItems?: Array<{
    productId: number;
    reason: string;
    requested?: number;
    available?: number;
  }>;
}

export interface PreValidationResponse {
  valid: boolean;
  issues: ValidationIssue[];
  estimatedTotal: number;
  estimatedDeliveryTime: string | null;
  darkStoreId: number | null;
  summary: {
    cartItemsCount: number;
    deliveryAvailable: boolean;
    inventoryAvailable: boolean;
  };
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: number;
  status?: string;
  totalAmount?: number;
  estimatedDeliveryTime?: string;
  payment?: {
    paymentId: string;
    confirmationUrl: string;
    status: string;
  };
  message?: string;
  processingTime?: number;
  error?: string;
  issues?: ValidationIssue[];
}

export interface OrderStatusResponse {
  success: boolean;
  order?: {
    id: number;
    status: string;
    total_amount: number;
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

class CheckoutService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/checkout`;

  /**
   * Pre-validation перед оформлением заказа
   * Минимизирует checkout failure rate
   */
  async preValidate(data: CheckoutData): Promise<PreValidationResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      logger.log('📋 Pre-validation checkout:', data);

      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok && response.status !== 400) {
        throw new Error('Ошибка валидации');
      }

      logger.log('✅ Pre-validation результат:', result);

      return result;
    } catch (error) {
      logger.error('❌ Ошибка pre-validation:', error);
      
      return {
        valid: false,
        issues: [
          {
            type: 'SYSTEM_ERROR',
            severity: 'error',
            message: error instanceof Error ? error.message : 'Ошибка валидации',
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
    }
  }

  /**
   * Оформление заказа (Optimistic Processing)
   * Быстрый ответ для лучшего UX
   */
  async processCheckout(data: CheckoutData): Promise<CheckoutResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      logger.log('📦 Оформление заказа:', data);

      const startTime = performance.now();

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      const clientTime = performance.now() - startTime;

      if (!response.ok) {
        logger.error('❌ Ошибка оформления заказа:', result);
        return {
          success: false,
          error: result.error || result.message || 'Ошибка оформления заказа',
          issues: result.issues,
        };
      }

      logger.log(`✅ Заказ #${result.orderId} создан за ${Math.round(clientTime)}ms`);

      return {
        ...result,
        clientProcessingTime: Math.round(clientTime),
      };
    } catch (error) {
      logger.error('❌ Ошибка checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Получить статус заказа
   * Для optimistic UI updates
   */
  async getOrderStatus(orderId: number): Promise<OrderStatusResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/${orderId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка получения статуса');
      }

      return result;
    } catch (error) {
      logger.error('❌ Ошибка получения статуса:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Полный checkout flow с pre-validation
   * Рекомендуемый способ оформления заказа
   */
  async checkout(data: CheckoutData): Promise<CheckoutResponse> {
    // 1. Pre-validation
    const validation = await this.preValidate(data);

    if (!validation.valid) {
      const errorIssues = validation.issues.filter((i) => i.severity === 'error');
      return {
        success: false,
        error: 'Не удалось пройти валидацию',
        issues: errorIssues,
      };
    }

    // 2. Оформление заказа
    return await this.processCheckout(data);
  }
}

export const checkoutService = new CheckoutService();


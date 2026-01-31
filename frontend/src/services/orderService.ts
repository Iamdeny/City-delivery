import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { authService } from './authService';
import type { Order, DeliveryInfo } from '../types/order';

export interface OrderData {
  phone: string;
  address: string;
  comment?: string;
  items: Array<{ productId: number; quantity: number }>;
  latitude?: number;
  longitude?: number;
}

export interface OrderResponse {
  success: boolean;
  orderId?: number;
  order?: Order;
  message?: string;
  error?: string;
  warning?: string;
  deliveryInfo?: DeliveryInfo;
}

class OrderService {
  /**
   * Создание заказа
   */
  async placeOrder(orderData: OrderData): Promise<OrderResponse> {
    try {
      logger.log('📤 Отправляем заказ на сервер:', orderData);

      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Если токен истек, пробуем обновить
        if (response.status === 401) {
          const newToken = await authService.refreshToken();
          if (newToken) {
            // Повторная попытка с новым токеном
            const retryResponse = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(orderData),
            });
            const retryResult = await retryResponse.json();
            if (retryResponse.ok) {
              return retryResult;
            }
          }
          throw new Error('Требуется повторный вход');
        }

        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      return result;
    } catch (error) {
      logger.error('Ошибка при оформлении заказа:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Получение заказов пользователя
   */
  async getMyOrders(): Promise<Order[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.orders || [];
    } catch (error) {
      logger.error('Ошибка получения заказов:', error);
      return [];
    }
  }

  /**
   * Получение заказа по ID
   */
  async getOrder(orderId: number): Promise<Order | null> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.order || null;
    } catch (error) {
      logger.error('Ошибка получения заказа:', error);
      return null;
    }
  }
}

export const orderService = new OrderService();


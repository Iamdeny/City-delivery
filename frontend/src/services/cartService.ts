/**
 * Smart Cart Service - интеграция с Backend Smart Cart API
 * Real-time price sync & Stock availability
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { authService } from './authService';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image?: string;
  darkStoreId?: number;
  addedAt?: string;
}

export interface Cart {
  userId: number;
  items: CartItem[];
  total: number;
  updatedAt: string;
}

export interface CartResponse {
  success: boolean;
  cart?: Cart;
  items?: CartItem[];
  total_amount?: number;
  fromCache?: boolean;
  error?: string;
  message?: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity?: number;
  darkStoreId?: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface ValidateCartResponse {
  success: boolean;
  valid: boolean;
  issues?: Array<{
    type: string;
    productId?: number;
    message: string;
    oldPrice?: number;
    newPrice?: number;
  }>;
  current?: number;
  required?: number;
  message?: string;
  error?: string;
}

class CartService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/cart`;

  /**
   * Получить корзину
   */
  async getCart(): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        logger.warn('⚠️ Нет токена, работаем с пустой корзиной');
        return {
          success: true,
          cart: {
            userId: 0,
            items: [],
            total: 0,
            updatedAt: new Date().toISOString(),
          },
        };
      }

      const response = await fetch(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      logger.log('🛒 Корзина получена:', result);

      return result;
    } catch (error) {
      logger.error('❌ Ошибка получения корзины:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Добавить товар в корзину
   */
  async addItem(data: AddToCartRequest): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ошибка добавления товара');
      }

      logger.log('✅ Товар добавлен в корзину:', result);
      return result;
    } catch (error) {
      logger.error('❌ Ошибка добавления товара:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Обновить количество товара
   */
  async updateQuantity(
    productId: number,
    data: UpdateQuantityRequest
  ): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/items/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ошибка обновления количества');
      }

      logger.log('✅ Количество обновлено:', result);
      return result;
    } catch (error) {
      logger.error('❌ Ошибка обновления количества:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Удалить товар из корзины
   */
  async removeItem(productId: number): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/items/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ошибка удаления товара');
      }

      logger.log('✅ Товар удален:', result);
      return result;
    } catch (error) {
      logger.error('❌ Ошибка удаления товара:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Валидация корзины (проверка цен и наличия)
   */
  async validateCart(): Promise<ValidateCartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok && response.status !== 400) {
        throw new Error(result.error || result.message || 'Ошибка валидации');
      }

      logger.log('✅ Валидация корзины:', result);
      return result;
    } catch (error) {
      logger.error('❌ Ошибка валидации корзины:', error);
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Синхронизация цен (real-time price sync)
   */
  async syncPrices(): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ошибка синхронизации');
      }

      logger.log('✅ Цены синхронизированы:', result);
      return result;
    } catch (error) {
      logger.error('❌ Ошибка синхронизации цен:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }

  /**
   * Очистить корзину
   */
  async clearCart(): Promise<CartResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Ошибка очистки корзины');
      }

      logger.log('✅ Корзина очищена');
      return result;
    } catch (error) {
      logger.error('❌ Ошибка очистки корзины:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      };
    }
  }
}

export const cartService = new CartService();


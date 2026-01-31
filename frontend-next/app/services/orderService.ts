/**
 * Сервис для работы с заказами
 * Временная версия - будет заменена на API Routes в Фазе 8
 * Мигрировано из frontend/src/services/orderService.ts
 */
'use client';

import { logger } from '@/lib/logger';
import { API_CONFIG, STORAGE_KEYS } from '@/lib/constants';
import { authService } from '@/app/services/authService';

export interface OrderData {
  phone: string;
  address: string;
  comment?: string;
  items: Array<{ productId: number; quantity: number }>;
  latitude?: number;
  longitude?: number;
  darkStoreId?: number;
}

export interface OrderResponse {
  success: boolean;
  orderId?: number;
  order?: {
    id: number;
    status: string;
  };
  error?: string;
  message?: string;
  details?: unknown;
  warning?: string;
  deliveryInfo?: {
    distance: number;
    estimatedTime: number;
  };
}

class OrderService {
  async createOrder(data: OrderData): Promise<OrderResponse> {
    try {
      logger.log('📤 Создание заказа...');
      
      // Получаем токен из localStorage (если есть)
      // Используем тот же ключ, что и в authService
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem(`${STORAGE_KEYS.PREFIX}access_token`) 
        : null;
      
      // Проверяем наличие токена
      if (!token) {
        logger.warn('⚠️ Токен не найден, заказ может быть отклонен backend');
        // Не выбрасываем ошибку здесь, пусть backend решит
        // Но можно добавить предупреждение для пользователя
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Используем API Route вместо прямого запроса к backend
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const result: OrderResponse = await response.json();

      if (!response.ok || !result.success) {
        // Если токен истек, пытаемся обновить его и повторить запрос
        const errorCode = String(result.error || '');
        const message = String(result.message || result.error || 'Ошибка создания заказа');

        if (message.includes('Токен истек') || message.includes('TokenExpiredError')) {
          logger.log('🔄 Токен истек, пытаемся обновить...');
          const newTokens = await authService.refreshAccessToken();
          
          if (newTokens) {
            // Повторяем запрос с новым токеном
            logger.log('🔄 Повторяем запрос с новым токеном...');
            const retryHeaders: HeadersInit = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newTokens.accessToken}`,
            };
            
            const retryResponse = await fetch('/api/orders', {
              method: 'POST',
              headers: retryHeaders,
              body: JSON.stringify(data),
            });

            const retryResult: OrderResponse = await retryResponse.json();

            if (!retryResponse.ok || !retryResult.success) {
              // Business failure after retry – return as response, don't throw.
              return {
                success: false,
                error: String(retryResult.error || 'ORDER_CREATE_FAILED'),
                message: String(retryResult.message || retryResult.error || 'Ошибка создания заказа'),
                details: (retryResult as any)?.details ?? null,
              };
            }

            logger.log('✅ Заказ создан после обновления токена:', retryResult.orderId);
            return retryResult;
          } else {
            // Не удалось обновить токен - требуем повторной авторизации
            throw new Error('Сессия истекла. Пожалуйста, войдите в систему снова');
          }
        }
        
        // Улучшаем сообщение об ошибке для случая отсутствия токена
        if (message.includes('Токен не предоставлен') || response.status === 401) {
          return { success: false, error: errorCode || 'UNAUTHORIZED', message: 'Для оформления заказа необходимо войти в систему' };
        }

        // Business/validation failures: return them to UI without throwing.
        logger.warn('Создание заказа отклонено:', { status: response.status, error: errorCode, message });
        return { success: false, error: errorCode || 'ORDER_CREATE_FAILED', message, details: (result as any)?.details ?? null };
      }

      logger.log('✅ Заказ создан:', result.orderId);
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isExpectedBusinessError =
        msg === 'DELIVERY_UNAVAILABLE' ||
        msg === 'COORDINATES_REQUIRED' ||
        msg === 'STORE_NOT_FOUND' ||
        msg.includes('Доставка недоступна') ||
        msg.includes('Недостаточно прав') ||
        msg.includes('Для оформления заказа необходимо войти') ||
        msg.includes('Сессия истекла') ||
        msg.includes('Токен истек') ||
        msg.includes('Корзина пуста') ||
        msg.includes('Адрес обязателен') ||
        msg.includes('Телефон обязателен');

      // Business errors are expected and should not look like app crashes in console.
      if (isExpectedBusinessError) {
        logger.warn('Создание заказа отклонено (business):', msg);
      } else {
        logger.error('Ошибка создания заказа:', error);
      }
      throw error;
    }
  }
}

export const orderService = new OrderService();

// Экспорт функции для совместимости
export const placeOrder = (data: OrderData): Promise<OrderResponse> => {
  return orderService.createOrder(data);
};

/**
 * Tracking Service - Real-time Order Tracking
 * WebSocket & Geofencing
 */

import { logger } from '../utils/logger';
import { API_CONFIG } from '../config/constants';
import { authService } from './authService';

export interface CourierLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  bearing?: number;
}

export interface TrackingInfo {
  orderId: number;
  courierId: number | null;
  courierName?: string;
  courierPhone?: string;
  status: string;
  location: CourierLocation | null;
  eta?: number; // в минутах
  distance?: number; // в метрах
  geofenceTriggered?: boolean;
}

export interface ETAResponse {
  success: boolean;
  orderId: number;
  eta: {
    minutes: number;
    arrivalTime: string;
    confidence: number;
    factors: {
      distance: number;
      traffic: string;
      weather?: string;
    };
  };
  error?: string;
}

class TrackingService {
  private baseUrl = `${API_CONFIG.BASE_URL}/api/tracking`;

  /**
   * Получить локацию курьера для заказа
   */
  async getOrderTracking(orderId: number): Promise<TrackingInfo | null> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
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
      logger.log('📍 Tracking info:', result);

      return result;
    } catch (error) {
      logger.error('❌ Ошибка получения tracking info:', error);
      return null;
    }
  }

  /**
   * Получить локацию курьера по ID
   */
  async getCourierLocation(courierId: number): Promise<CourierLocation | null> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/courier/${courierId}`, {
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
      return result.location;
    } catch (error) {
      logger.error('❌ Ошибка получения локации курьера:', error);
      return null;
    }
  }

  /**
   * Получить ETA (estimated time of arrival)
   */
  async getETA(orderId: number): Promise<ETAResponse | null> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Требуется авторизация');
      }

      const response = await fetch(`${this.baseUrl}/eta/${orderId}`, {
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
      logger.log('⏱️ ETA:', result);

      return result;
    } catch (error) {
      logger.error('❌ Ошибка получения ETA:', error);
      return null;
    }
  }

  /**
   * Подписаться на обновления локации (polling)
   * Для WebSocket подписки используйте websocketService
   */
  startPolling(
    orderId: number,
    callback: (tracking: TrackingInfo | null) => void,
    interval: number = 10000 // 10 секунд
  ): () => void {
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      const tracking = await this.getOrderTracking(orderId);
      callback(tracking);

      if (isActive) {
        setTimeout(poll, interval);
      }
    };

    poll();

    // Возвращаем функцию для отмены подписки
    return () => {
      isActive = false;
    };
  }
}

export const trackingService = new TrackingService();


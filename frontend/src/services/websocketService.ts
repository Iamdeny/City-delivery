/**
 * Сервис для работы с WebSocket
 * Real-time обновления заказов
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger';
import { WS_CONFIG } from '../config/constants';
import { authService } from './authService';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Подключение к WebSocket
   */
  connect(): Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = authService.getToken();
    if (!token) {
      logger.warn('Нельзя подключиться к WebSocket без токена');
      return null;
    }

    try {
      this.socket = io(WS_CONFIG.BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        logger.log('✅ WebSocket подключен');
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason: string) => {
        logger.warn('⚠️ WebSocket отключен:', reason);
      });

      this.socket.on('connect_error', (error: Error) => {
        logger.error('❌ Ошибка подключения WebSocket:', error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.error('Превышено количество попыток переподключения');
        }
      });

      return this.socket;
    } catch (error) {
      logger.error('Ошибка создания WebSocket соединения:', error);
      return null;
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      logger.log('👋 WebSocket отключен');
    }
  }

  /**
   * Подписка на обновления заказа
   */
  subscribeToOrder(orderId: number, callback: (data: { orderId?: number; id?: number; [key: string]: unknown }) => void): void {
    if (!this.socket) {
      this.connect();
    }

    if (this.socket) {
      this.socket.emit('subscribe-to-order', orderId);
      this.socket.on('order-updated', (data: { orderId?: number; id?: number; [key: string]: unknown }) => {
        if (data.orderId === orderId || data.id === orderId) {
          callback(data);
        }
      });
      logger.log(`📡 Подписка на заказ ${orderId}`);
    }
  }

  /**
   * Отписка от обновлений заказа
   */
  unsubscribeFromOrder(orderId: number): void {
    if (this.socket) {
      this.socket.off('order-updated');
      logger.log(`📡 Отписка от заказа ${orderId}`);
    }
  }

  /**
   * Проверка подключения
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Получение экземпляра socket
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();


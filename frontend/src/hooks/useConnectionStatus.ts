import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/constants';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  isOnline: boolean;
  checkConnection: () => Promise<void>;
  lastChecked: Date | null;
}

/**
 * Хук для проверки статуса соединения с сервером
 */
export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    // Проверяем онлайн статус браузера
    if (!navigator.onLine) {
      setStatus('disconnected');
      setIsOnline(false);
      return;
    }

    setStatus('checking');
    setIsOnline(true);

    try {
      // Проверяем соединение с API через health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus('connected');
        setIsOnline(true);
        setLastChecked(new Date());
      } else {
        setStatus('error');
        setIsOnline(false);
      }
    } catch (error) {
      // Ошибка сети или таймаут
      setStatus('disconnected');
      setIsOnline(false);
    }
  }, []);

  // Проверка при монтировании
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Слушаем события онлайн/офлайн
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Периодическая проверка соединения (каждые 30 секунд)
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkConnection();
      }
    }, 30000); // 30 секунд

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    status,
    isOnline,
    checkConnection,
    lastChecked,
  };
}


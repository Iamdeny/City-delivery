/**
 * Хук для проверки статуса соединения с сервером
 * Мигрировано из frontend/src/hooks/useConnectionStatus.ts
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/lib/constants';

export type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  isOnline: boolean;
  checkConnection: () => void;
  lastChecked: Date | null;
}

/**
 * Хук для проверки статуса соединения с сервером
 */
export function useConnectionStatus(): UseConnectionStatusReturn {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    // Проверяем онлайн статус браузера (только на клиенте)
    if (typeof window === 'undefined' || !navigator.onLine) {
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

      // Используем API Route для проверки соединения
      const healthEndpoint = API_CONFIG.ENDPOINTS.HEALTH || '/api/health';
      const response = await fetch(healthEndpoint, {
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
        // 503 - это нормально, если backend недоступен
        // Не показываем ошибку в консоли, просто отмечаем как disconnected
        const data = await response.json().catch(() => ({}));
        if (data.code === 'BACKEND_UNAVAILABLE' || response.status === 503) {
          setStatus('disconnected');
        } else {
          setStatus('error');
        }
        setIsOnline(false);
      }
    } catch (error) {
      // Ошибка сети или таймаут - это нормально для health check
      // Не логируем ошибку, просто отмечаем как disconnected
      setStatus('disconnected');
      setIsOnline(false);
    }
  }, []);

  // Проверка при монтировании (только на клиенте)
  // Откладываем проверку, чтобы не блокировать рендеринг
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setIsOnline(navigator.onLine);
    // Откладываем health check на следующий тик, чтобы не блокировать LCP
    const timeoutId = setTimeout(() => {
      checkConnection();
    }, 100); // Небольшая задержка для неблокирующего рендеринга
    
    return () => clearTimeout(timeoutId);
  }, [checkConnection]);

  // Слушаем события онлайн/офлайн (только на клиенте)
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
    if (typeof window === 'undefined') return;

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

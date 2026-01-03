/**
 * Order Tracking Hook - Real-time courier location updates
 */

import { useState, useEffect, useCallback } from 'react';
import { trackingService, TrackingInfo, ETAResponse } from '../services/trackingService';
import { logger } from '../utils/logger';

export const useOrderTracking = (orderId: number | null, autoStart: boolean = true) => {
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [eta, setEta] = useState<ETAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Загрузить tracking info
   */
  const loadTracking = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await trackingService.getOrderTracking(orderId);
      setTracking(result);

      if (!result) {
        setError('Информация о доставке недоступна');
      }
    } catch (err) {
      logger.error('Ошибка загрузки tracking:', err);
      setError('Не удалось загрузить информацию о доставке');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  /**
   * Загрузить ETA
   */
  const loadETA = useCallback(async () => {
    if (!orderId) return;

    try {
      const result = await trackingService.getETA(orderId);
      setEta(result);
    } catch (err) {
      logger.error('Ошибка загрузки ETA:', err);
    }
  }, [orderId]);

  /**
   * Начать polling обновлений
   */
  const startPolling = useCallback(
    (interval: number = 10000) => {
      if (!orderId || isPolling) return;

      setIsPolling(true);
      logger.log(`📍 Начат polling для заказа #${orderId}`);

      const stopPolling = trackingService.startPolling(
        orderId,
        (trackingInfo) => {
          setTracking(trackingInfo);
        },
        interval
      );

      return stopPolling;
    },
    [orderId, isPolling]
  );

  /**
   * Остановить polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    logger.log('📍 Polling остановлен');
  }, []);

  /**
   * Обновить tracking вручную
   */
  const refresh = useCallback(async () => {
    await loadTracking();
    await loadETA();
  }, [loadTracking, loadETA]);

  // Автоматическая загрузка при монтировании
  useEffect(() => {
    if (autoStart && orderId) {
      loadTracking();
      loadETA();
    }
  }, [orderId, autoStart, loadTracking, loadETA]);

  // Автоматический старт polling
  useEffect(() => {
    if (autoStart && orderId && !isPolling) {
      const stopFn = startPolling();
      return () => {
        if (stopFn) stopFn();
      };
    }
  }, [orderId, autoStart, isPolling, startPolling]);

  /**
   * Вычисляемые значения
   */
  const hasCourier = tracking?.courierId !== null;
  const hasLocation = tracking?.location !== null;
  const isActive = tracking?.status && ['assigned', 'picked', 'delivering'].includes(tracking.status);

  return {
    // State
    tracking,
    eta,
    isLoading,
    error,
    isPolling,

    // Computed
    hasCourier,
    hasLocation,
    isActive,

    // Methods
    loadTracking,
    loadETA,
    startPolling,
    stopPolling,
    refresh,
  };
};


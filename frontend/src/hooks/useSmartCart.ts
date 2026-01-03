/**
 * Smart Cart Hook - Интеграция с Backend Smart Cart API
 * Real-time price sync, Stock availability, Server-side persistence
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cartService, Cart, CartItem } from '../services/cartService';
import { logger } from '../utils/logger';
import { useNotifications } from './useNotifications';

export const useSmartCart = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { showNotification } = useNotifications();

  // Загрузить корзину с сервера
  const loadCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await cartService.getCart();
      if (response.success && response.cart) {
        setCart(response.cart);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      logger.error('Ошибка загрузки корзины:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Загрузить корзину при монтировании
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Автоматическая синхронизация цен каждые 5 минут
  useEffect(() => {
    const interval = setInterval(async () => {
      if (cart && cart.items.length > 0) {
        await syncPrices();
      }
    }, 5 * 60 * 1000); // 5 минут

    return () => clearInterval(interval);
  }, [cart]);

  // Вычисляемые значения
  const totalItems = useMemo(() => {
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart?.total || 0;
  }, [cart]);

  const hasItems = useMemo(() => {
    return (cart?.items.length || 0) > 0;
  }, [cart]);

  /**
   * Добавить товар в корзину
   */
  const addToCart = useCallback(
    async (productId: number, quantity: number = 1, darkStoreId?: number) => {
      try {
        const response = await cartService.addItem({
          productId,
          quantity,
          darkStoreId,
        });

        if (response.success && response.cart) {
          setCart(response.cart);
          showNotification('Товар добавлен в корзину', 'success');
          return true;
        } else {
          showNotification(response.error || 'Ошибка добавления товара', 'error');
          return false;
        }
      } catch (error) {
        logger.error('Ошибка добавления в корзину:', error);
        showNotification('Не удалось добавить товар', 'error');
        return false;
      }
    },
    [showNotification]
  );

  /**
   * Обновить количество товара
   */
  const updateQuantity = useCallback(
    async (productId: number, quantity: number) => {
      if (quantity < 1) {
        return await removeFromCart(productId);
      }

      try {
        const response = await cartService.updateQuantity(productId, { quantity });

        if (response.success && response.cart) {
          setCart(response.cart);
          return true;
        } else {
          showNotification(response.error || 'Ошибка обновления количества', 'error');
          return false;
        }
      } catch (error) {
        logger.error('Ошибка обновления количества:', error);
        showNotification('Не удалось обновить количество', 'error');
        return false;
      }
    },
    [showNotification]
  );

  /**
   * Удалить товар из корзины
   */
  const removeFromCart = useCallback(
    async (productId: number) => {
      try {
        const response = await cartService.removeItem(productId);

        if (response.success && response.cart) {
          setCart(response.cart);
          showNotification('Товар удален из корзины', 'info');
          return true;
        } else {
          showNotification(response.error || 'Ошибка удаления товара', 'error');
          return false;
        }
      } catch (error) {
        logger.error('Ошибка удаления из корзины:', error);
        showNotification('Не удалось удалить товар', 'error');
        return false;
      }
    },
    [showNotification]
  );

  /**
   * Увеличить количество на 1
   */
  const incrementQuantity = useCallback(
    async (productId: number) => {
      const item = cart?.items.find((i) => i.productId === productId);
      if (item) {
        return await updateQuantity(productId, item.quantity + 1);
      }
      return false;
    },
    [cart, updateQuantity]
  );

  /**
   * Уменьшить количество на 1
   */
  const decrementQuantity = useCallback(
    async (productId: number) => {
      const item = cart?.items.find((i) => i.productId === productId);
      if (item) {
        return await updateQuantity(productId, item.quantity - 1);
      }
      return false;
    },
    [cart, updateQuantity]
  );

  /**
   * Очистить корзину
   */
  const clearCart = useCallback(async () => {
    try {
      const response = await cartService.clearCart();

      if (response.success) {
        setCart({
          userId: cart?.userId || 0,
          items: [],
          total: 0,
          updatedAt: new Date().toISOString(),
        });
        showNotification('Корзина очищена', 'info');
        return true;
      } else {
        showNotification(response.error || 'Ошибка очистки корзины', 'error');
        return false;
      }
    } catch (error) {
      logger.error('Ошибка очистки корзины:', error);
      return false;
    }
  }, [cart, showNotification]);

  /**
   * Валидация корзины (проверка цен и наличия)
   */
  const validateCart = useCallback(async () => {
    try {
      const response = await cartService.validateCart();

      if (!response.success) {
        showNotification(response.error || 'Ошибка валидации корзины', 'error');
        return false;
      }

      if (!response.valid) {
        // Показываем проблемы пользователю
        if (response.issues && response.issues.length > 0) {
          response.issues.forEach((issue) => {
            showNotification(issue.message, 'info');
          });
        }
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Ошибка валидации корзины:', error);
      return false;
    }
  }, [showNotification]);

  /**
   * Синхронизация цен (Real-time Price Sync)
   */
  const syncPrices = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const response = await cartService.syncPrices();

      if (response.success && response.cart) {
        setCart(response.cart);
        setLastSyncTime(new Date());

        // Если были изменения цен, уведомляем пользователя
        // (это можно улучшить, сравнивая старые и новые цены)
        logger.log('✅ Цены синхронизированы');
      }
    } catch (error) {
      logger.error('Ошибка синхронизации цен:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  /**
   * Получить товар из корзины по ID
   */
  const getCartItem = useCallback(
    (productId: number): CartItem | undefined => {
      return cart?.items.find((item) => item.productId === productId);
    },
    [cart]
  );

  /**
   * Проверить, есть ли товар в корзине
   */
  const isInCart = useCallback(
    (productId: number): boolean => {
      return cart?.items.some((item) => item.productId === productId) || false;
    },
    [cart]
  );

  return {
    cart: cart?.items || [],
    totalAmount,
    totalItems,
    hasItems,
    isLoading,
    isSyncing,
    lastSyncTime,
    addToCart,
    removeFromCart,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    validateCart,
    syncPrices,
    loadCart,
    getCartItem,
    isInCart,
  };
};


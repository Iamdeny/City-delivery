/**
 * Хук для работы с уведомлениями
 * Мигрировано из frontend/src/hooks/useNotifications.ts
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

// Простой глобальный стор, чтобы уведомления были общими для всего приложения
let store: Notification[] = [];
const listeners = new Set<(next: Notification[]) => void>();

function notify() {
  for (const listener of listeners) {
    listener(store);
  }
}

function setStore(next: Notification[]) {
  store = next;
  notify();
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(store);

  // Подписка на глобальные изменения
  useEffect(() => {
    listeners.add(setNotifications);
    // синхронизация на случай, если стор обновился до подписки
    setNotifications(store);
    return () => {
      listeners.delete(setNotifications);
    };
  }, []);

  // Добавление уведомления
  const showNotification = useCallback(
    (message: string, type: NotificationType = 'info') => {
      const id =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = {
        id,
        message,
        type,
        timestamp: Date.now(),
      };

      setStore([newNotification, ...store]);

      // Автоматическое удаление через 4 секунды
      setTimeout(() => {
        setStore(store.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  // Удаление уведомления по ID
  const removeNotification = useCallback((id: string) => {
    setStore(store.filter((n) => n.id !== id));
  }, []);

  // Очистка всех уведомлений
  const clearAllNotifications = useCallback(() => {
    setStore([]);
  }, []);

  // Мемоизируем возвращаемый объект
  return useMemo(() => ({
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  }), [notifications, showNotification, removeNotification, clearAllNotifications]);
};

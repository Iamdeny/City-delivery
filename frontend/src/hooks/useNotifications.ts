import { useState, useCallback, useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

      setNotifications((prev) => [newNotification, ...prev]);

      // Автоматическое удаление через 4 секунды
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 4000);
    },
    []
  );

  // Удаление уведомления по ID
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Очистка всех уведомлений
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Автоматическая очистка старых уведомлений (старше 10 секунд)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => prev.filter((n) => now - n.timestamp < 10000));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
  };
};

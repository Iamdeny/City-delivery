/**
 * NotificationContainer - контейнер для глобальных уведомлений
 * Мигрировано из frontend/src/components/Notification/NotificationContainer.tsx
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useNotifications, type Notification } from '@/app/hooks/useNotifications';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <div className="fixed top-[calc(20px+var(--safe-top))] right-5 z-[9999] flex flex-col gap-2.5 max-w-[350px] md:max-w-[350px] md:right-5 md:left-auto left-5">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ x: 400, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.9 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className={`flex items-start p-3.5 rounded-lg shadow-lg cursor-pointer transition-transform duration-300 hover:-translate-x-1 backdrop-blur-md border border-white/10 ${getNotificationStyles(
              notification.type
            )}`}
            onClick={() => removeNotification(notification.id)}
          >
            {/* Icon */}
            <div className="mr-3 mt-0.5 flex-shrink-0 flex items-center justify-center w-6 h-6">
              {getIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="m-0 mb-1 text-sm font-medium leading-snug">
                {notification.message}
              </p>
              <span className="text-xs opacity-80 font-normal">
                {new Date(notification.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Close Button */}
            <button
              className="ml-2.5 bg-transparent border-none text-white/70 cursor-pointer p-0 leading-none w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 hover:bg-white/20 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(notification.id);
              }}
              aria-label="Закрыть уведомление"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

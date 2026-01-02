import React from 'react';
import './NotificationContainer.css';
import { Notification } from '../../hooks/useNotifications';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onRemove,
}) => {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className='notification-container'>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type}`}
          onClick={() => onRemove(notification.id)}
        >
          <div className='notification__icon'>
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'info' && 'ℹ️'}
          </div>
          <div className='notification__content'>
            <p className='notification__message'>{notification.message}</p>
            <span className='notification__time'>
              {new Date(notification.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <button
            className='notification__close'
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
            aria-label='Закрыть уведомление'
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;

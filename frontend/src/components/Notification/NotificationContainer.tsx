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
            {notification.type === 'success' && (
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' fill='currentColor'/>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z' fill='currentColor'/>
              </svg>
            )}
            {notification.type === 'info' && (
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' fill='currentColor'/>
              </svg>
            )}
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
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z' fill='currentColor'/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;

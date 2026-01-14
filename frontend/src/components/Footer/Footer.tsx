import React from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import './Footer.css';

interface FooterProps {
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalAmount: number;
}

const Footer: React.FC<FooterProps> = ({
  loading,
  error,
  totalItems,
  totalAmount,
}) => {
  const { status, isOnline, checkConnection } = useConnectionStatus();

  const getStatusText = () => {
    if (status === 'checking') {
      return 'Проверка соединения...';
    }
    if (status === 'connected' && isOnline) {
      return 'Сервер подключен';
    }
    if (status === 'disconnected' || !isOnline) {
      return 'Нет соединения';
    }
    if (status === 'error') {
      return 'Ошибка подключения';
    }
    return 'Проверка соединения...';
  };

  const getStatusIcon = () => {
    if (status === 'checking') {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z' fill='currentColor'/>
        </svg>
      );
    }
    if (status === 'connected' && isOnline) {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z' fill='currentColor'/>
        </svg>
      );
    }
    if (status === 'disconnected' || !isOnline) {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' fill='currentColor'/>
        </svg>
      );
    }
    if (status === 'error') {
      return (
        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' fill='currentColor'/>
        </svg>
      );
    }
    return null;
  };

  return (
    <footer className='footer'>
      <div className='footer-content'>
        <p>© {new Date().getFullYear()} Доставка продуктов. Ваш город.</p>
        <p className='footer-contact'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z' fill='currentColor'/>
          </svg>
          Телефон: +7 (999) 123-45-67
          <span className='footer-separator'>|</span>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z' fill='currentColor'/>
          </svg>
          Время работы: 8:00-22:00
        </p>
        <p className='status-info'>
          <button
            onClick={checkConnection}
            className={`connection-status-btn status-${status}`}
            disabled={status === 'checking'}
            aria-label='Проверить соединение'
          >
            {getStatusIcon()}
            {getStatusText()}
          </button>
        </p>
        <div className='footer-stats'>
          <span>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z' fill='currentColor'/>
            </svg>
            Товаров: {totalItems}
          </span>
          <span>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z' fill='currentColor'/>
            </svg>
            Сумма: <PriceDisplay price={totalAmount} size="sm" />
          </span>
          <span>
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z' fill='currentColor'/>
            </svg>
            Автосохранение
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

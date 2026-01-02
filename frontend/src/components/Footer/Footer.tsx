import React from 'react';
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
  return (
    <footer className='footer'>
      <div className='footer-content'>
        <p>© {new Date().getFullYear()} Доставка продуктов. Ваш город.</p>
        <p>📞 Телефон: +7 (999) 123-45-67 | 🕐 Время работы: 8:00-22:00</p>
        <p className='status-info'>
          {loading
            ? '🔄 Проверка соединения...'
            : error
            ? '⚠️ Ошибка подключения'
            : '✅ Сервер подключен'}
        </p>
        <div className='footer-stats'>
          <span>🛒 Товаров: {totalItems}</span>
          <span>💰 Сумма: {totalAmount} ₽</span>
          <span>💾 Автосохранение</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

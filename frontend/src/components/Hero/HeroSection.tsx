/**
 * Hero Section - от Getir + Gorillas
 * Первое, что видит пользователь
 */

import React, { useState, useEffect } from 'react';
import './HeroSection.css';

interface HeroSectionProps {
  deliveryAddress?: string;
  deliveryTime?: number; // в минутах
  onAddressClick?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  deliveryAddress = 'Укажите адрес доставки',
  deliveryTime = 15,
  onAddressClick,
}) => {
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  const promos = [
    {
      title: '🔥 Скидка 30% на первый заказ',
      subtitle: 'Промокод: FIRST30',
      bgColor: 'var(--color-secondary-500)',
    },
    {
      title: '⚡ Бесплатная доставка от 500₽',
      subtitle: 'Только сегодня!',
      bgColor: 'var(--color-primary-600)',
    },
    {
      title: '🎁 +100 бонусов за заказ',
      subtitle: 'Начните копить баллы',
      bgColor: 'var(--color-success-600)',
    },
  ];

  // Автоматическая смена промо каждые 5 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promos.length]);

  const currentPromo = promos[currentPromoIndex];

  return (
    <div className="hero-section">
      {/* Address Bar (от Getir - всегда сверху) */}
      <div className="hero-address-bar" onClick={onAddressClick}>
        <div className="hero-address-content">
          <div className="hero-address-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="hero-address-text">
            <span className="hero-address-label">Доставка по адресу</span>
            <span className="hero-address-value">{deliveryAddress}</span>
          </div>
          <div className="hero-address-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M7 10l5 5 5-5z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Delivery Promise (от Getir - четкий USP) */}
      <div className="hero-promise">
        <div className="hero-promise-icon">⚡</div>
        <div className="hero-promise-text">
          <span className="hero-promise-title">Доставка за {deliveryTime} минут</span>
          <span className="hero-promise-subtitle">или бесплатно</span>
        </div>
      </div>

      {/* Rotating Promo Banner (от Gorillas - визуальный акцент) */}
      <div 
        className="hero-promo"
        style={{ '--promo-bg': currentPromo.bgColor } as React.CSSProperties}
      >
        <div className="hero-promo-content">
          <h2 className="hero-promo-title">{currentPromo.title}</h2>
          <p className="hero-promo-subtitle">{currentPromo.subtitle}</p>
        </div>

        {/* Dots indicator */}
        <div className="hero-promo-dots">
          {promos.map((_, index) => (
            <button
              key={index}
              className={`hero-promo-dot ${index === currentPromoIndex ? 'active' : ''}`}
              onClick={() => setCurrentPromoIndex(index)}
              aria-label={`Промо ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Quick Stats (от Yandex Lavka - доверие) */}
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-value">10,000+</div>
          <div className="hero-stat-label">товаров</div>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <div className="hero-stat-value">⭐ 4.9</div>
          <div className="hero-stat-label">рейтинг</div>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <div className="hero-stat-value">24/7</div>
          <div className="hero-stat-label">работаем</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;


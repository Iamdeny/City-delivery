import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchBar } from '../Search/SearchBar';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import './HeaderPremium.css';

interface HeaderPremiumProps {
  hasItems: boolean;
  totalItems: number;
  totalAmount: number;
  loading: boolean;
  onRefreshProducts: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  onSearchChange: (query: string) => void;
  user: { name: string; email: string } | null;
  onLoginClick: () => void;
  onRegisterClick?: () => void;
  onLogout: () => void;
  onCartClick?: () => void;
  deliveryAddress?: string;
  onAddressClick?: () => void;
}

const HeaderPremium: React.FC<HeaderPremiumProps> = ({
  hasItems,
  totalItems,
  totalAmount,
  loading,
  onRefreshProducts,
  showNotification,
  onSearchChange,
  user,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onCartClick,
  deliveryAddress = 'Укажите адрес доставки',
  onAddressClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevCartItems, setPrevCartItems] = useState(totalItems);
  const [cartPulse, setCartPulse] = useState(false);

  // Отслеживание скролла для sticky header (обычный scroll listener)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pulse анимация при изменении корзины
  useEffect(() => {
    if (totalItems > prevCartItems) {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    setPrevCartItems(totalItems);
  }, [totalItems]); // Убрали prevCartItems из зависимостей


  return (
    <motion.header
      className={`header-premium ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="header-premium__container">
        {/* Десктопная версия */}
        <div className="header-premium__desktop">
          {/* Левая секция: Лого + Адрес */}
          <div className="header-premium__left">
            {/* Logo */}
            <motion.div
              className="header-premium__logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="logo-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                  <path
                    d="M16 8L20 12H18V20H14V12H12L16 8Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M10 22H22V24H10V22Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <defs>
                    <linearGradient
                      id="logo-gradient"
                      x1="0"
                      y1="0"
                      x2="32"
                      y2="32"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#6366F1" />
                      <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="logo-text">
                <span className="logo-title">Доставка</span>
                <span className="logo-subtitle">за 15 минут</span>
              </div>
            </motion.div>

            {/* Address Bar (вдохновлено Getir + Yandex Lavka) */}
            <motion.button
              className="header-premium__address"
              onClick={onAddressClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="address-icon"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div className="address-content">
                <span className="address-label">Адрес доставки</span>
                <span className="address-value">{deliveryAddress}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="address-arrow"
              >
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </motion.button>
          </div>

          {/* Центральная секция: Поиск */}
          <div className="header-premium__center">
            <SearchBar
              onSearch={onSearchChange}
              placeholder="Найти продукты..."
            />
          </div>

          {/* Правая секция: Действия */}
          <div className="header-premium__right">

            {/* Refresh Button */}
            <motion.button
              className="refresh-btn"
              onClick={onRefreshProducts}
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </motion.button>

            {/* Cart Button with Pulse */}
            <motion.button
              className={`cart-btn ${cartPulse ? 'pulse' : ''}`}
              onClick={onCartClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={cartPulse ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="cart-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                {totalItems > 0 && (
                  <motion.span
                    className="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>
              {hasItems && (
                <div className="cart-info">
                  <span className="cart-amount">
                    <PriceDisplay price={totalAmount} size="md" />
                  </span>
                  <span className="cart-eta">~15 мин</span>
                </div>
              )}
            </motion.button>

            {/* User Menu */}
            {user ? (
              <div className="user-menu">
                <motion.button
                  className="user-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="user-avatar">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="user-name">{user.name || user.email}</span>
                </motion.button>
                <motion.button
                  className="logout-btn"
                  onClick={onLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Выйти
                </motion.button>
              </div>
            ) : (
              <div className="auth-buttons">
                <motion.button
                  className="login-btn"
                  onClick={onLoginClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Войти
                </motion.button>
                {onRegisterClick && (
                  <motion.button
                    className="register-btn"
                    onClick={onRegisterClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Регистрация
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Мобильная версия */}
        <div className="header-premium__mobile">
          {/* Первая строка: Лого + Адрес */}
          <div className="mobile-top-row">
            <motion.div
              className="mobile-logo"
              whileTap={{ scale: 0.95 }}
            >
              <div className="logo-icon-mobile">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="6" fill="url(#mobile-logo-gradient)" />
                  <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="white" fillOpacity="0.9" />
                  <path d="M10 22H22V24H10V22Z" fill="white" fillOpacity="0.9" />
                  <defs>
                    <linearGradient id="mobile-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#6366F1" />
                      <stop offset="1" stopColor="#8B5CF6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </motion.div>

            <motion.button
              className="mobile-address"
              onClick={onAddressClick}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="mobile-address-text">{deliveryAddress}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </motion.button>

            <div className="mobile-actions">
              {/* Cart Button */}
              <motion.button
                className={`mobile-cart-btn ${cartPulse ? 'pulse' : ''}`}
                onClick={onCartClick}
                whileTap={{ scale: 0.9 }}
                animate={cartPulse ? { scale: [1, 1.15, 1] } : {}}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
                {totalItems > 0 && (
                  <motion.span
                    className="mobile-cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.button>

              {/* User Button */}
              {user ? (
                <motion.button
                  className="mobile-user-btn"
                  onClick={onLogout}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="mobile-user-avatar">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                </motion.button>
              ) : (
                <motion.button
                  className="mobile-login-btn"
                  onClick={onLoginClick}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </motion.button>
              )}
            </div>
          </div>

          {/* Вторая строка: Поиск */}
          <div className="mobile-bottom-row">
            <SearchBar
              onSearch={onSearchChange}
              placeholder="Поиск товаров..."
            />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default React.memo(HeaderPremium);


/**
 * Нижняя навигационная панель для мобильных устройств
 */

import React from 'react';
import './BottomNav.css';

interface BottomNavProps {
  activeTab?: 'home' | 'cart' | 'profile';
  onTabChange?: (tab: 'home' | 'cart' | 'profile') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab = 'home',
  onTabChange,
}) => {
  return (
    <nav className='bottom-nav'>
      <button
        className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange?.('home')}
        aria-label='Главная'
      >
        <span className='bottom-nav-icon'>🏠</span>
        <span className='bottom-nav-label'>Главная</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
        onClick={() => onTabChange?.('cart')}
        aria-label='Корзина'
      >
        <span className='bottom-nav-icon'>🛒</span>
        <span className='bottom-nav-label'>Корзина</span>
      </button>

      <button
        className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => onTabChange?.('profile')}
        aria-label='Профиль'
      >
        <span className='bottom-nav-icon'>👤</span>
        <span className='bottom-nav-label'>Профиль</span>
      </button>
    </nav>
  );
};

export default BottomNav;


import React from 'react';
import { SearchBar } from '../Search/SearchBar';
import './Header.css';

interface HeaderProps {
  hasItems: boolean;
  totalItems: number;
  totalAmount: number;
  loading: boolean;
  onRefreshProducts: () => void;
  onRestoreCart: () => boolean;
  showNotification: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allCategories: string[];
  storageCartCount: number;
  cartLength: number;
}

const Header: React.FC<HeaderProps> = ({
  hasItems,
  totalItems,
  totalAmount,
  loading,
  onRefreshProducts,
  onRestoreCart,
  showNotification,
  searchQuery,
  onSearchChange,
  allCategories,
  storageCartCount,
  cartLength,
}) => {
  const handleRestoreClick = () => {
    if (onRestoreCart()) {
      showNotification('Корзина восстановлена', 'success');
    }
  };

  return (
    <header className='header'>
      <div className='header-content'>
        <div className='logo'>
          <h1>🏪 Доставка продуктов</h1>
          <p>Из темного магазина за 15-30 минут</p>
          {hasItems && <div className='autosave-label'>💾 Автосохранение</div>}
        </div>

        {/* Поиск в шапке */}
        <div className='header-search'>
          <SearchBar
            onSearch={onSearchChange}
            placeholder='Поиск молока, хлеба, яиц...'
            suggestions={allCategories}
          />
        </div>

        <div className='header-controls'>
          {/* Кнопка восстановления корзины (только на мобильных) */}
          <div className='show-on-mobile'>
            {storageCartCount > 0 && cartLength === 0 && (
              <button onClick={handleRestoreClick} className='restore-btn'>
                ♻️ Восстановить
              </button>
            )}
          </div>

          <div className='controls-row'>
            <button
              onClick={onRefreshProducts}
              className='refresh-btn'
              disabled={loading}
              aria-label={loading ? 'Загрузка товаров' : 'Обновить товары'}
            >
              {loading ? '🔄' : '🔄'}
              <span className='hide-on-mobile'>Обновить</span>
            </button>

            <div className='cart-summary'>
              <div className='cart-icon'>
                🛒
                {totalItems > 0 && (
                  <span className='cart-count'>{totalItems}</span>
                )}
              </div>
              <div className='cart-total-header'>
                <span>Итого:</span>
                <strong>{totalAmount} ₽</strong>
              </div>
            </div>
          </div>

          {/* Кнопка восстановления (только на десктопе) */}
          <div className='hide-on-mobile'>
            {storageCartCount > 0 && cartLength === 0 && (
              <button onClick={handleRestoreClick} className='restore-btn'>
                ♻️ Восстановить корзину
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

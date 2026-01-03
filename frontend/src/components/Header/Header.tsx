import React, { useCallback } from 'react';
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
  user: { name: string; email: string } | null;
  onLoginClick: () => void;
  onRegisterClick?: () => void;
  onLogout: () => void;
  onCartClick?: () => void;
}

function Header({
  hasItems,
  totalItems,
  totalAmount,
  loading,
  onRefreshProducts,
  onRestoreCart,
  showNotification,
  onSearchChange,
  allCategories,
  storageCartCount,
  cartLength,
  user,
  onLoginClick,
  onRegisterClick,
  onLogout,
  onCartClick,
}: HeaderProps) {
  const handleRestoreClick = useCallback(() => {
    if (onRestoreCart()) {
      showNotification('Корзина восстановлена', 'success');
    }
  }, [onRestoreCart, showNotification]);

  const shouldShowRestoreButton = storageCartCount > 0 && cartLength === 0;

  return (
    <header className='header header-modern'>
      <div className='header-content'>
        {/* Мобильная версия: компактный дизайн */}
        <div className='header-mobile'>
          {/* Первая строка: логотип и корзина */}
          <div className='header-top-row'>
            <div className='logo-mobile'>
              <span className='logo-icon-mobile'>С</span>
              <span className='logo-text-mobile'>Доставка</span>
            </div>

            <div className='header-actions-mobile'>
              {/* Кнопка корзины */}
              <button
                className='cart-btn-mobile'
                onClick={onCartClick}
                aria-label={`Корзина: ${totalItems} товаров`}
              >
                <svg
                  width='24'
                  height='24'
                  viewBox='0 0 24 24'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z'
                    fill='currentColor'
                  />
                </svg>
                {totalItems > 0 && (
                  <span className='cart-badge-mobile' aria-hidden='true'>
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Профиль/Авторизация (только иконка на мобильных) */}
              {user ? (
                <button
                  className='profile-btn-mobile'
                  onClick={onLogout}
                  aria-label='Профиль'
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z'
                      fill='currentColor'
                    />
                  </svg>
                </button>
              ) : (
                <button
                  className='profile-btn-mobile'
                  onClick={onLoginClick}
                  aria-label='Войти'
                >
                  <svg
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z'
                      fill='currentColor'
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Вторая строка: поиск */}
          <div className='header-search-mobile'>
            <SearchBar
              onSearch={onSearchChange}
              placeholder='Поиск товаров...'
              suggestions={allCategories}
            />
          </div>
        </div>

        {/* Десктопная версия: расширенный дизайн */}
        <div className='header-desktop'>
          <div className='logo-desktop'>
            <span className='logo-icon-desktop'>С</span>
            <h1 className='logo-text-desktop'>Доставка продуктов</h1>
          </div>

          <div className='header-search-desktop'>
            <SearchBar
              onSearch={onSearchChange}
              placeholder='Искать в Доставке продуктов'
              suggestions={allCategories}
            />
          </div>

          <div className='header-controls-desktop'>
            <button
              onClick={onRefreshProducts}
              className='refresh-btn-desktop'
              disabled={loading}
              aria-label={loading ? 'Загрузка товаров' : 'Обновить товары'}
            >
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z'
                  fill='currentColor'
                />
              </svg>
              <span>Обновить</span>
            </button>

            {shouldShowRestoreButton && (
              <button
                onClick={handleRestoreClick}
                className='restore-btn-desktop'
                aria-label='Восстановить корзину'
              >
                ♻️ Восстановить
              </button>
            )}

            <button
              className='cart-btn-desktop'
              onClick={onCartClick}
              aria-label={`Корзина: ${totalItems} товаров`}
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z'
                  fill='currentColor'
                />
              </svg>
              {totalItems > 0 && (
                <>
                  <span className='cart-badge-desktop' aria-hidden='true'>
                    {totalItems}
                  </span>
                  <span className='cart-total-desktop'>
                    {totalAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </>
              )}
            </button>

            <div className='auth-section-desktop'>
              {user ? (
                <div className='user-info-desktop'>
                  <span className='user-name-desktop'>{user.name}</span>
                  <button
                    onClick={onLogout}
                    className='logout-btn-desktop'
                    aria-label='Выйти'
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <div className='auth-buttons-desktop'>
                  <button
                    onClick={onLoginClick}
                    className='auth-btn-desktop login-btn-desktop'
                    aria-label='Войти'
                  >
                    Войти
                  </button>
                  <button
                    onClick={onRegisterClick || onLoginClick}
                    className='auth-btn-desktop register-btn-desktop'
                    aria-label='Зарегистрироваться'
                  >
                    Регистрация
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);

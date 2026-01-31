import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { ProductSkeleton } from './components/Skeleton/ProductSkeleton';
import { useProductFilters, SortOption } from './hooks/useProductFilters';
import { useUrlFilters } from './hooks/useUrlFilters';
import { useNotifications } from './hooks/useNotifications';
import HeaderPremium from './components/Header/HeaderPremium';
import FiltersSidebar from './components/Filters/FiltersSidebar';
import CategoryNav from './components/Navigation/CategoryNav';
import ProductGrid from './components/Product/ProductGrid';
import CartModal from './components/Cart/CartModal';
import NotificationContainer from './components/Notification/NotificationContainer';
import { Breadcrumbs } from './components/Navigation/Breadcrumbs';
import Footer from './components/Footer/Footer';
import LoginForm from './components/Auth/LoginForm';
import FloatingCartButton from './components/Mobile/FloatingCartButton';
import { orderService } from './services/orderService';
import { authService, type User } from './services/authService';
import { websocketService } from './services/websocketService';
import { logger } from './utils/logger';
import { TIMEOUTS, BREAKPOINTS } from './config/constants';
import './App.css';

function App() {
  // Состояние авторизации
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState<'login' | 'register' | false>(false);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            websocketService.connect();
          } else {
            // Пробуем получить пользователя с сервера
            try {
              const serverUser = await authService.getMe();
              setUser(serverUser);
              websocketService.connect();
            } catch {
              // Если не получилось - разлогиниваем
              authService.logout();
            }
          }
        }
      } catch (error) {
        logger.error('Ошибка проверки авторизации:', error);
      }
    };

    checkAuth();
  }, []);

  // Хук продуктов
  const { products, loading, error, refetch } = useProducts();

  // Хук корзины
  const {
    cart,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    decrementQuantity,
    updateQuantity,
    clearCart,
    hasItems,
  } = useCart();

  // Хук уведомлений
  const { notifications, showNotification, removeNotification } =
    useNotifications();

  // Мемоизируем пропсы для useProductFilters чтобы избежать бесконечного цикла
  const productFiltersProps = useMemo(() => ({ products }), [products]);
  
  // Хук фильтрации
  const {
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories,
    filteredProducts,
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
    resetFilters,
    setFiltersFromUrl,
    hasActiveFilters,
    activeFiltersCount,
  } = useProductFilters(productFiltersProps);

  // Примитивы для dependency arrays (без сложных выражений)
  const selectedCategoriesKey = useMemo(
    () => selectedCategories.join(','),
    [selectedCategories]
  );
  const selectedMinPrice = priceRange[0];
  const selectedMaxPrice = priceRange[1];

  // Используем ref для стабильного callback
  const minPriceRef = useRef(minPrice);
  const maxPriceRef = useRef(maxPrice);
  
  useEffect(() => {
    minPriceRef.current = minPrice;
    maxPriceRef.current = maxPrice;
  }, [minPrice, maxPrice]);

  // Мемоизируем onFiltersChange - используем ref для полной стабильности
  const handleFiltersChange = useCallback(
    (urlFilters: any) => {
      setFiltersFromUrl({
        search: urlFilters.search || '',
        categories: Array.isArray(urlFilters.categories)
          ? urlFilters.categories
          : [],
        priceRange: [
          typeof urlFilters.minPrice === 'number'
            ? urlFilters.minPrice
            : minPriceRef.current,
          typeof urlFilters.maxPrice === 'number'
            ? urlFilters.maxPrice
            : maxPriceRef.current,
        ],
        sort: (urlFilters.sort as SortOption) || 'relevance',
      });
    },
    [setFiltersFromUrl]
  );

  // Хук синхронизации с URL
  // Передаём только примитивы (minPrice, maxPrice) вместо объекта!
  const { syncUrlWithFilters, resetUrl, isInitialized } = useUrlFilters({
    initialMinPrice: minPrice,
    initialMaxPrice: maxPrice,
    onFiltersChange: handleFiltersChange,
  });

  // Состояние для мобильных фильтров
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);

  // Определяем тип устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Мемоизированные обработчики

  // Обновление товаров
  const refreshProducts = useCallback(() => {
    refetch();
    showNotification('Товары обновляются...', 'info');
  }, [refetch, showNotification]);

  // Оформление заказа
  const handlePlaceOrder = useCallback(
    async (orderData: Parameters<typeof orderService.placeOrder>[0]) => {
      // Проверяем авторизацию перед заказом
      if (!authService.isAuthenticated()) {
        setShowLogin('login');
        throw new Error('Требуется авторизация для оформления заказа');
      }
      return orderService.placeOrder(orderData);
    },
    []
  );

  // Обработчики авторизации
  const handleLoginSuccess = useCallback(async () => {
    try {
      // Получаем пользователя с сервера для актуальных данных
      const currentUser = await authService.getMe();
      setUser(currentUser);
      setShowLogin(false);
      websocketService.connect();
      showNotification(`Добро пожаловать, ${currentUser.name}!`, 'success');
    } catch (error) {
      // Если не получилось получить с сервера, используем локальные данные
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setShowLogin(false);
        websocketService.connect();
        showNotification('Вход выполнен успешно', 'success');
      } else {
        showNotification('Ошибка при получении данных пользователя', 'error');
      }
    }
  }, [showNotification]);

  const handleLogout = useCallback(() => {
    authService.logout();
    websocketService.disconnect();
    setUser(null);
    showNotification('Выход выполнен', 'info');
  }, [showNotification]);

  // Сброс всех фильтров
  const handleResetAllFilters = useCallback(() => {
    resetFilters();
    resetUrl();
    if (isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [resetFilters, resetUrl, isMobile]);

  // Синхронизация с URL (включено после исправления архитектуры)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      syncUrlWithFilters({
        search: searchQuery,
        categories: selectedCategories,
        minPrice: selectedMinPrice,
        maxPrice: selectedMaxPrice,
        sort: sortOption,
      });
    }, TIMEOUTS.DEBOUNCE);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedCategories,
    selectedMinPrice,
    selectedMaxPrice,
    sortOption,
    isInitialized,
    syncUrlWithFilters,
  ]);


  // Хлебные крошки (мемоизировано)
  const breadcrumbsItems = useMemo(() => {
    const items = [
      {
        label: 'Все товары',
        onClick: handleResetAllFilters,
        isActive:
          !searchQuery &&
          selectedCategories.length === 0 &&
          priceRange[0] === minPrice &&
          priceRange[1] === maxPrice,
      },
    ];

    if (searchQuery) {
      items.push({
        label: `Поиск: "${searchQuery}"`,
        onClick: () => setSearchQuery(''),
        isActive: true,
      });
    }

    if (selectedCategories.length > 0) {
      items.push({
        label: `Категории: ${selectedCategories.length}`,
        onClick: () => setSelectedCategories([]),
        isActive: true,
      });
    }

    if (priceRange[0] > minPrice || priceRange[1] < maxPrice) {
      items.push({
        label: `Цена: ${priceRange[0]} - ${priceRange[1]} ₽`,
        onClick: () => setPriceRange([minPrice, maxPrice]),
        isActive: true,
      });
    }

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchQuery,
    selectedCategoriesKey,
    selectedMinPrice,
    selectedMaxPrice,
    minPrice,
    maxPrice,
    handleResetAllFilters,
    // setSearchQuery, setSelectedCategories, setPriceRange стабильны (useState setters)
  ]);

  // Пропсы для FiltersSidebar (общие для всех версий)
  const filtersSidebarProps = {
    minPrice,
    maxPrice,
    priceRange,
    onPriceChange: setPriceRange,
    categories: allCategories as string[],
    selectedCategories,
    onCategoryChange: setSelectedCategories,
    sortOption,
    onSortChange: setSortOption,
    onResetFilters: () => {
      resetFilters();
      if (isMobile) {
        setMobileFiltersOpen(false);
      }
    },
    productsCount: products.length,
    filteredProductsCount: filteredProducts.length,
  };

  return (
    <div className='app'>
      {/* Шапка приложения - Premium UI */}
      <HeaderPremium
        hasItems={hasItems}
        totalItems={totalItems}
        totalAmount={totalAmount}
        loading={loading}
        onRefreshProducts={refreshProducts}
        showNotification={showNotification}
        onSearchChange={setSearchQuery}
        user={user}
        onLoginClick={() => setShowLogin('login')}
        onRegisterClick={() => setShowLogin('register')}
        onLogout={handleLogout}
        onCartClick={() => setShowCartModal(true)}
        deliveryAddress={user ? 'ул. Пушкина, д. 10' : 'Укажите адрес доставки'}
        onAddressClick={() => showNotification('Выбор адреса скоро появится!', 'info')}
      />

      {/* Навигация и хлебные крошки */}
      <div className='navigation-bar'>
        <div className='navigation-content'>
          <Breadcrumbs items={breadcrumbsItems} showHome={false} />

          <div className='navigation-actions'>
            {/* Кнопка фильтров для мобильных */}
            {isMobile && (
              <button
                className='filter-toggle-btn'
                onClick={() => setMobileFiltersOpen(true)}
                aria-label='Открыть фильтры'
              >
                🔍 Фильтры
                {activeFiltersCount > 0 && (
                  <span className='filters-count-badge'>
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {(hasActiveFilters || activeFiltersCount > 0) && (
              <button
                onClick={handleResetAllFilters}
                className='clear-url-btn'
                aria-label='Сбросить всё и очистить URL'
                title='Сбросить все фильтры и очистить URL'
              >
                🗑️ Сбросить всё
              </button>
            )}
          </div>
        </div>

        {/* Информация о активных фильтрах */}
        {activeFiltersCount > 0 && (
          <div className='url-info'>
            <span>🎯 Активных фильтров: {activeFiltersCount}</span>
            <span className="separator-dot">•</span>
            <span>
              🔗{' '}
              <a
                href={window.location.href}
                target='_blank'
                rel='noopener noreferrer'
                title='Открыть эту ссылку в новой вкладке'
              >
                Ссылка с фильтрами
              </a>
            </span>
          </div>
        )}
      </div>

      {/* Основной контент - ТОВАРЫ СРАЗУ ПОСЛЕ НАВИГАЦИИ */}
      <main className='main-container'>
        <div className='products-wrapper'>
          {/* Левая панель - Навигация по категориям (в стиле Самоката) */}
          {!isMobile && (
            <aside className='category-nav-sidebar'>
              <CategoryNav
                categories={allCategories}
                selectedCategories={selectedCategories}
                onCategoryClick={(category) => {
                  if (selectedCategories.includes(category)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== category));
                  } else {
                    setSelectedCategories([...selectedCategories, category]);
                  }
                }}
              />
            </aside>
          )}

          {/* Центральная часть - Товары */}
          <div className='product-grid-container'>
            {loading ? (
              <ProductSkeleton count={isMobile ? 4 : 8} />
            ) : (
              <ProductGrid
                products={products}
                filteredProducts={filteredProducts}
                loading={loading}
                error={error}
                onAddToCart={addToCart}
                onRemoveFromCart={decrementQuantity}
                onRefreshProducts={refreshProducts}
                onResetFilters={handleResetAllFilters}
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                priceRange={priceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
                cart={cart}
              />
            )}
          </div>
        </div>

      </main>

      {/* Модальное окно фильтров для мобильных (ВНЕ основного контента) */}
      {isMobile && (
        <>
          {/* Оверлей для закрытия */}
          {mobileFiltersOpen && (
            <div
              className='mobile-filters-overlay'
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* Само модальное окно */}
          <div
            className={`mobile-filters-modal ${
              mobileFiltersOpen ? 'active' : ''
            }`}
          >
            <div className='mobile-filters-header'>
              <h3>Фильтры</h3>
              <button
                className='close-filters-btn'
                onClick={() => setMobileFiltersOpen(false)}
                aria-label='Закрыть фильтры'
              >
                ✕
              </button>
            </div>
            <div className='mobile-filters-content'>
              <FiltersSidebar {...filtersSidebarProps} />
            </div>
          </div>
        </>
      )}

      {/* Подвал */}
      <Footer
        loading={loading}
        error={error}
        totalItems={totalItems}
        totalAmount={totalAmount}
      />

      {/* Уведомления */}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />

      {/* Форма входа/регистрации */}
      {showLogin && (
        <LoginForm
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLogin(false)}
          initialMode={showLogin}
        />
      )}

      {/* Модальное окно корзины */}
      <CartModal
        isOpen={showCartModal}
        onClose={() => setShowCartModal(false)}
        cart={cart}
        totalAmount={totalAmount}
        totalItems={totalItems}
        hasItems={hasItems}
        loading={loading}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        onClearCart={clearCart}
        onShowNotification={showNotification}
        onGoToShopping={() => {
          setShowCartModal(false);
        }}
      />

      {/* Плавающая кнопка корзины (только на мобильных) */}
      {isMobile && (
        <FloatingCartButton
          totalAmount={totalAmount}
          totalItems={totalItems}
          estimatedTime='15 минут'
          onClick={() => {
            setShowCartModal(true);
          }}
        />
      )}

    </div>
  );
}

export default React.memo(App);

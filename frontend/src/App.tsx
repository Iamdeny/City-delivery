import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { StorageService } from './utils/storage';
import { ProductSkeleton } from './components/Skeleton/ProductSkeleton';
import { CartSkeleton } from './components/Skeleton/CartSkeleton';
import { useProductFilters, SortOption } from './hooks/useProductFilters';
import { useUrlFilters } from './hooks/useUrlFilters';
import { useNotifications } from './hooks/useNotifications';
import Header from './components/Header/Header';
import FiltersSidebar from './components/Filters/FiltersSidebar';
import ProductGrid from './components/Product/ProductGrid';
import CartItems from './components/Cart/CartItems';
import OrderForm from './components/Order/OrderForm';
import NotificationContainer from './components/Notification/NotificationContainer';
import { Breadcrumbs } from './components/Navigation/Breadcrumbs';
import Footer from './components/Footer/Footer';
import { orderService } from './services/orderService';
import './App.css';

function App() {
  // Хук продуктов
  const { products, loading, error, refetch } = useProducts();
  // После получения продуктов
  useEffect(() => {
    if (products.length > 0) {
      console.log('📦 Первый товар:', products[0]);
      console.log('🖼️ Есть ли поле image?', 'image' in products[0]);
      console.log('📊 Все поля первого товара:', Object.keys(products[0]));
    }
  }, [products]);

  // Хук корзины
  const {
    cart,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    restoreCart,
    hasItems,
  } = useCart();

  // Хук уведомлений
  const { notifications, showNotification, removeNotification } =
    useNotifications();

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
  } = useProductFilters({ products });

  // Хук синхронизации с URL
  const { syncUrlWithFilters, resetUrl, isInitialized } = useUrlFilters({
    initialFilters: {
      search: searchQuery,
      categories: selectedCategories,
      priceRange: [minPrice, maxPrice],
      sort: sortOption,
    },
    onFiltersChange: useCallback(
      (urlFilters) => {
        console.log('🔗 Фильтры из URL:', urlFilters);
        setFiltersFromUrl({
          search: urlFilters.search || '',
          categories: Array.isArray(urlFilters.categories)
            ? urlFilters.categories
            : [],
          priceRange: [
            typeof urlFilters.minPrice === 'number'
              ? urlFilters.minPrice
              : minPrice,
            typeof urlFilters.maxPrice === 'number'
              ? urlFilters.maxPrice
              : maxPrice,
          ],
          sort: (urlFilters.sort as SortOption) || 'relevance',
        });
      },
      [setFiltersFromUrl, minPrice, maxPrice]
    ),
  });

  // Состояние для мобильных фильтров
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Определяем тип устройства
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Все что меньше 1024px считаем мобильным
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
      return orderService.placeOrder(orderData);
    },
    []
  );

  // Сброс всех фильтров
  const handleResetAllFilters = useCallback(() => {
    resetFilters();
    resetUrl();
    if (isMobile) {
      setMobileFiltersOpen(false);
    }
  }, [resetFilters, resetUrl, isMobile]);

  // Синхронизация с URL (с дебаунсом)
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      syncUrlWithFilters({
        search: searchQuery,
        categories: selectedCategories,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sort: sortOption,
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    isInitialized,
    syncUrlWithFilters,
  ]);

  // Автовосстановление корзины
  useEffect(() => {
    if (StorageService.getCartCount() > 0 && cart.length === 0) {
      const timer = setTimeout(() => {
        const shouldAutoRestore = window.confirm(
          `Найдена сохранённая корзина с ${StorageService.getCartCount()} товарами. Восстановить?`
        );
        if (shouldAutoRestore) {
          restoreCart();
          showNotification('Корзина восстановлена', 'success');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cart.length, restoreCart, showNotification]);

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
  }, [
    searchQuery,
    selectedCategories,
    priceRange,
    minPrice,
    maxPrice,
    handleResetAllFilters,
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
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

  // Для отладки - логирование
  console.log('📱 isMobile:', isMobile);
  console.log('🚪 mobileFiltersOpen:', mobileFiltersOpen);
  console.log('🏷️ Categories count:', allCategories?.length);
  console.log('📦 Products count:', products.length);

  return (
    <div className='app'>
      {/* Шапка приложения */}
      <Header
        hasItems={hasItems}
        totalItems={totalItems}
        totalAmount={totalAmount}
        loading={loading}
        onRefreshProducts={refreshProducts}
        onRestoreCart={restoreCart}
        showNotification={showNotification}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        allCategories={allCategories as string[]}
        storageCartCount={StorageService.getCartCount()}
        cartLength={cart.length}
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
            <span style={{ margin: '0 8px' }}>•</span>
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
          {/* Фильтры для десктопа (ТОЛЬКО когда НЕ мобильный) */}
          {!isMobile && (
            <div className='filters-sidebar'>
              <FiltersSidebar {...filtersSidebarProps} />
            </div>
          )}

          {/* Сетка товаров (ВСЕГДА видна) */}
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
                onRefreshProducts={refreshProducts}
                onResetFilters={handleResetAllFilters}
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                priceRange={priceRange}
                minPrice={minPrice}
                maxPrice={maxPrice}
                allCategories={allCategories as string[]}
                onSetSelectedCategories={setSelectedCategories}
                onSetSearchQuery={setSearchQuery}
                onSetPriceRange={setPriceRange}
              />
            )}
          </div>
        </div>

        {/* Правая колонка - Корзина */}
        <aside className='cart-section slide-up'>
          <div className='section-header'>
            <h2>🛒 Корзина {hasItems && `(${totalItems})`}</h2>
            {hasItems && (
              <button
                onClick={clearCart}
                className='clear-cart-btn'
                aria-label='Очистить корзину'
              >
                Очистить
              </button>
            )}
          </div>

          {!hasItems ? (
            <div className='empty-cart'>
              <div className='empty-cart-content'>
                <div className='empty-cart-icon'>🛒</div>
                <p>Корзина пуста</p>
                <small>Добавьте товары из списка</small>
                {StorageService.getCartCount() > 0 && (
                  <button
                    onClick={() => {
                      if (restoreCart()) {
                        showNotification('Корзина восстановлена', 'success');
                      }
                    }}
                    className='restore-cart-button'
                  >
                    ♻️ Восстановить сохранённую корзину
                  </button>
                )}
              </div>
            </div>
          ) : loading && cart.length === 0 ? (
            <CartSkeleton />
          ) : (
            <>
              {/* Товары в корзине */}
              <CartItems
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromCart}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />

              {/* Форма заказа */}
              <OrderForm
                cart={cart}
                onPlaceOrder={handlePlaceOrder}
                onClearCart={clearCart}
                onShowNotification={showNotification}
                totalAmount={totalAmount}
                totalItems={totalItems}
              />
            </>
          )}
        </aside>
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
              {/* Тестовый текст для проверки */}
              <div
                style={{
                  color: 'red',
                  padding: '10px',
                  marginBottom: '10px',
                  border: '1px solid red',
                }}
              >
                📱 Мобильные фильтры работают!
              </div>
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
    </div>
  );
}

export default React.memo(App);

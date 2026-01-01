import React, { useState, useEffect } from 'react';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { StorageService } from './utils/storage';
import { ProductSkeleton } from './components/Skeleton/ProductSkeleton';
import { CartSkeleton } from './components/Skeleton/CartSkeleton';
import { SearchBar } from './components/Search/SearchBar';
import { CategoryFilter } from './components/Filter/CategoryFilter';
import { PriceFilter } from './components/Filter/PriceFilter';
import { useProductFilters, SortOption } from './hooks/useProductFilters';
import { useUrlFilters } from './hooks/useUrlFilters';
import { Breadcrumbs } from './components/Navigation/Breadcrumbs';
import './App.css';

// Интерфейс для корзины
interface CartItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock?: boolean;
  quantity: number;
}

function App() {
  const { products, loading, error, refetch } = useProducts();
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

  // Используем хук фильтрации
  const {
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories,
    filteredProducts,
    urlFilterState, // ← ДОБАВЬТЕ
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
    resetFilters,
    setFiltersFromUrl, // ← ДОБАВЬТЕ
    hasActiveFilters, // ← ДОБАВЬТЕ
    activeFiltersCount, // ← ДОБАВЬТЕ
  } = useProductFilters({
    products,
  });
  // Добавьте сразу после useProductFilters:
  // URL навигация
  const { syncUrlWithFilters, resetUrl, getShareableUrl, isInitialized } =
    useUrlFilters({
      initialFilters: {
        search: searchQuery,
        categories: selectedCategories,
        priceRange: [minPrice, maxPrice],
        sort: sortOption,
      },
      onFiltersChange: (urlFilters) => {
        console.log('🔗 Фильтры из URL:', urlFilters);

        // Обновляем фильтры из URL
        setFiltersFromUrl({
          search: urlFilters.search,
          categories: urlFilters.categories,
          priceRange: [urlFilters.minPrice, urlFilters.maxPrice],
          sort: urlFilters.sort,
        });
      },
    });

  // Синхронизируем URL при изменении фильтров
  useEffect(() => {
    if (!isInitialized) return;

    const urlFilterState = {
      search: searchQuery,
      categories: selectedCategories,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: sortOption,
    };

    syncUrlWithFilters(urlFilterState);
  }, [
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    isInitialized,
    syncUrlWithFilters,
  ]);
  // Дебаг-информация
  useEffect(() => {
    if (products.length > 0) {
      console.log('📊 Статистика данных:', {
        всего_товаров: products.length,
        отфильтровано: filteredProducts.length,
        все_категории: allCategories,
        диапазон_цен: { min: minPrice, max: maxPrice },
        текущие_фильтры: {
          поиск: searchQuery,
          категории: selectedCategories,
          цена: priceRange,
          сортировка: sortOption,
        },
      });
    }
  }, [
    products,
    filteredProducts,
    allCategories,
    minPrice,
    maxPrice,
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
  ]);

  // Автовосстановление корзины при загрузке
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
  }, [cart.length, restoreCart]);

  // Оформить заказ
  const placeOrder = async () => {
    if (cart.length === 0) {
      showNotification('Корзина пуста!', 'error');
      return;
    }

    const phone = prompt('Введите ваш телефон:', '+7 (999) 123-45-67');
    if (!phone || phone.trim() === '') {
      showNotification('Телефон обязателен!', 'error');
      return;
    }

    const address = prompt(
      'Введите адрес доставки:',
      'ул. Ленина, д. 1, кв. 5'
    );
    if (!address || address.trim() === '') {
      showNotification('Адрес обязателен!', 'error');
      return;
    }

    const comment = prompt('Комментарий к заказу (необязательно):', '');

    try {
      const orderData = {
        phone: phone.trim(),
        address: address.trim(),
        comment: comment?.trim() || '',
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      console.log('📤 Отправляем заказ:', orderData);

      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        showNotification(`Заказ #${result.orderNumber} создан!`, 'success');
        clearCart();
      } else {
        showNotification(`Ошибка: ${result.error}`, 'error');
      }
    } catch (err) {
      console.error('Ошибка оформления заказа:', err);
      showNotification('Ошибка соединения с сервером', 'error');
    }
  };

  // Показать уведомление
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    if (type === 'success') {
      notification.style.background = '#10b981';
    } else if (type === 'error') {
      notification.style.background = '#ef4444';
    } else {
      notification.style.background = '#3b82f6';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Добавляем стили для анимаций
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Кнопка обновления товаров
  const refreshProducts = () => {
    refetch();
    showNotification('Товары обновляются...', 'info');
  };

  // Найдите testFilters и обновите функции:
  const testFilters = {
    // Только поиск
    searchMilk: () => {
      setSearchQuery('Молоко');
      setSelectedCategories([]);
      setPriceRange([minPrice, maxPrice]);
      setSortOption('relevance');
      showNotification('Ищем только молоко...', 'info');
    },

    // Только категория
    filterDairy: () => {
      setSearchQuery('');
      setSelectedCategories(['Молочные продукты']);
      setPriceRange([minPrice, maxPrice]);
      setSortOption('relevance');
      showNotification('Только молочные продукты', 'info');
    },

    // Только цена
    filterCheap: () => {
      setSearchQuery('');
      setSelectedCategories([]);
      setPriceRange([0, 100]);
      setSortOption('relevance');
      showNotification('Только товары до 100 руб', 'info');
    },

    // Комбинированный фильтр
    filterMilkDairyCheap: () => {
      setSearchQuery('Молоко');
      setSelectedCategories(['Молочные продукты']);
      setPriceRange([0, 100]);
      setSortOption('price-asc');
      showNotification(
        'Молоко в молочных до 100 руб, сортировка по цене',
        'info'
      );
    },

    // Показать всё
    showAll: () => {
      resetFilters();
      resetUrl();
      showNotification('Показаны все товары', 'info');
    },
  };
  // Добавьте после хуков, перед return:
  // Хлебные крошки
  // Вспомогательная функция для названий сортировки
  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case 'price-asc':
        return 'По возрастанию цены';
      case 'price-desc':
        return 'По убыванию цены';
      case 'name-asc':
        return 'А-Я';
      case 'name-desc':
        return 'Я-А';
      default:
        return 'Релевантность';
    }
  };
  const breadcrumbsItems = [
    {
      label: 'Все товары',
      onClick: () => {
        resetFilters();
        resetUrl();
      },
      isActive:
        !searchQuery &&
        selectedCategories.length === 0 &&
        priceRange[0] === minPrice &&
        priceRange[1] === maxPrice &&
        sortOption === 'relevance',
    },
    ...(searchQuery
      ? [
          {
            label: `Поиск: "${searchQuery}"`,
            onClick: () => setSearchQuery(''),
            isActive: true,
          },
        ]
      : []),
    ...(selectedCategories.length > 0
      ? [
          {
            label: `Категории: ${selectedCategories.length}`,
            onClick: () => setSelectedCategories([]),
            isActive: true,
          },
        ]
      : []),
    ...(priceRange[0] > minPrice || priceRange[1] < maxPrice
      ? [
          {
            label: `Цена: ${priceRange[0]} - ${priceRange[1]} ₽`,
            onClick: () => setPriceRange([minPrice, maxPrice]),
            isActive: true,
          },
        ]
      : []),
    ...(sortOption !== 'relevance'
      ? [
          {
            label: `Сортировка: ${getSortLabel(sortOption)}`,
            onClick: () => setSortOption('relevance'),
            isActive: true,
          },
        ]
      : []),
  ];

  return (
    <div className='app'>
      {/* Шапка */}
      <header className='header'>
        <div className='header-content'>
          <div className='logo'>
            <h1>🏪 Доставка продуктов</h1>
            <p>Из темного магазина за 15-30 минут</p>
            {hasItems && (
              <div
                style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}
              >
                💾 Автосохранение
              </div>
            )}
          </div>

          {/* Поиск в шапке */}
          <div className='header-search'>
            <SearchBar
              onSearch={setSearchQuery}
              placeholder='Поиск молока, хлеба, яиц...'
              suggestions={allCategories}
            />
          </div>

          <div className='header-controls'>
            {/* Кнопка восстановления корзины (только на мобильных) */}
            <div className='show-on-mobile'>
              {StorageService.getCartCount() > 0 && cart.length === 0 && (
                <button
                  onClick={() => {
                    if (restoreCart()) {
                      showNotification('Корзина восстановлена', 'success');
                    }
                  }}
                  className='restore-btn'
                >
                  ♻️ Восстановить
                </button>
              )}
            </div>

            <div className='controls-row'>
              <button
                onClick={refreshProducts}
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
              {StorageService.getCartCount() > 0 && cart.length === 0 && (
                <button
                  onClick={() => {
                    if (restoreCart()) {
                      showNotification('Корзина восстановлена', 'success');
                    }
                  }}
                  className='restore-btn'
                >
                  ♻️ Восстановить корзину
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Навигация и хлебные крошки */}
      <div className='navigation-bar'>
        <div className='navigation-content'>
          <Breadcrumbs items={breadcrumbsItems} showHome={false} />

          <div className='navigation-actions'>
            {(hasActiveFilters || activeFiltersCount > 0) && (
              <button
                onClick={() => {
                  resetFilters();
                  resetUrl();
                }}
                className='clear-url-btn'
                aria-label='Сбросить всё и очистить URL'
                title='Сбросить все фильтры и очистить URL'
              >
                🗑️ Очистить всё
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
      <main className='main-container'>
        {/* Основной контент с фильтрами и товарами */}
        <div className='products-wrapper'>
          {/* Панель фильтров */}
          <aside className='filters-sidebar'>
            <div className='filters-header'>
              <h3>Фильтры</h3>
              <button
                onClick={resetFilters}
                className='reset-filters-btn'
                aria-label='Сбросить все фильтры'
              >
                Сбросить всё
              </button>
            </div>

            {/* Тестовые кнопки для проверки */}
            <div
              className='test-filters'
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed #38bdf8',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#0c4a6e',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}
              >
                🧪 Тест фильтров:
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <button
                  onClick={testFilters.searchMilk}
                  style={{
                    padding: '6px 10px',
                    background: '#7dd3fc',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  🔍 Только "Молоко"
                </button>
                <button
                  onClick={testFilters.filterDairy}
                  style={{
                    padding: '6px 10px',
                    background: '#7dd3fc',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  🥛 Только "Молочные"
                </button>
                <button
                  onClick={testFilters.filterCheap}
                  style={{
                    padding: '6px 10px',
                    background: '#7dd3fc',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  💰 Только до 100 руб
                </button>
                <button
                  onClick={testFilters.filterMilkDairyCheap}
                  style={{
                    padding: '6px 10px',
                    background: '#38bdf8',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  🧪 Комбо: Молоко + Молочные + до 100р
                </button>
                <button
                  onClick={testFilters.showAll}
                  style={{
                    padding: '6px 10px',
                    background: '#0ea5e9',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  🗑️ Сбросить все фильтры
                </button>
              </div>
            </div>

            {/* Фильтр по цене */}
            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              currentMin={priceRange[0]}
              currentMax={priceRange[1]}
              onPriceChange={(min, max) => {
                console.log('💰 Изменение цены:', { min, max });
                setPriceRange([min, max]);
              }}
            />

            {/* Фильтр по категориям */}
            <CategoryFilter
              categories={allCategories}
              selectedCategories={selectedCategories}
              onCategoryChange={(categories) => {
                console.log('🏷️ Изменение категорий:', categories);
                setSelectedCategories(categories);
              }}
            />

            {/* Сортировка */}
            <div className='sort-filter'>
              <h3 className='filter-title'>Сортировка</h3>
              <select
                value={sortOption}
                onChange={(e) => {
                  console.log('📊 Изменение сортировки:', e.target.value);
                  setSortOption(e.target.value as SortOption);
                }}
                className='sort-select'
                aria-label='Сортировка товаров'
              >
                <option value='relevance'>По релевантности</option>
                <option value='price-asc'>Цена: по возрастанию</option>
                <option value='price-desc'>Цена: по убыванию</option>
                <option value='name-asc'>Название: А-Я</option>
                <option value='name-desc'>Название: Я-А</option>
              </select>
            </div>

            {/* Статистика фильтрации */}
            <div className='filter-stats'>
              <div className='stat-item'>
                <span className='stat-label'>Всего товаров:</span>
                <span className='stat-value'>{products.length}</span>
              </div>
              <div className='stat-item'>
                <span className='stat-label'>Показано:</span>
                <span
                  className='stat-value'
                  style={{
                    color:
                      filteredProducts.length !== products.length
                        ? '#007aff'
                        : 'inherit',
                    fontWeight:
                      filteredProducts.length !== products.length
                        ? 'bold'
                        : 'normal',
                  }}
                >
                  {filteredProducts.length}
                </span>
              </div>
              {(searchQuery ||
                selectedCategories.length > 0 ||
                priceRange[0] > minPrice ||
                priceRange[1] < maxPrice) && (
                <div className='stat-item'>
                  <span className='stat-label'>Активные фильтры:</span>
                  <span className='stat-value'>
                    {searchQuery && `поиск`}
                    {searchQuery && selectedCategories.length > 0 && ', '}
                    {selectedCategories.length > 0 &&
                      `${selectedCategories.length} категории`}
                    {(searchQuery || selectedCategories.length > 0) &&
                      (priceRange[0] > minPrice || priceRange[1] < maxPrice) &&
                      ', '}
                    {(priceRange[0] > minPrice || priceRange[1] < maxPrice) &&
                      `цена`}
                  </span>
                </div>
              )}
            </div>
          </aside>

          {/* Основной контент - Товары */}
          <section className='products-section'>
            {/* Индикатор активных фильтров */}
            {(searchQuery ||
              selectedCategories.length > 0 ||
              priceRange[0] > minPrice ||
              priceRange[1] < maxPrice) && (
              <div
                style={{
                  padding: '10px 16px',
                  background: '#fffbeb',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  border: '1px solid #fbbf24',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: '#92400e', fontWeight: 'bold' }}>
                  🎯 Активные фильтры:
                </span>
                {searchQuery && (
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🔍 "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#92400e',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '2px',
                      }}
                      aria-label='Убрать поиск'
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedCategories.length > 0 && (
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🏷️ {selectedCategories.length} категории
                    <button
                      onClick={() => setSelectedCategories([])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#92400e',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '2px',
                      }}
                      aria-label='Убрать категории'
                    >
                      ✕
                    </button>
                  </span>
                )}
                {(priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    💰 {priceRange[0]} - {priceRange[1]} ₽
                    <button
                      onClick={() => setPriceRange([minPrice, maxPrice])}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#92400e',
                        cursor: 'pointer',
                        fontSize: '10px',
                        padding: '2px',
                      }}
                      aria-label='Сбросить цену'
                    >
                      ✕
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    resetFilters();
                    resetUrl();
                  }}
                  style={{
                    marginLeft: 'auto',
                    padding: '4px 8px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  🗑️ Сбросить все
                </button>
              </div>
            )}

            <div className='section-header'>
              <h2>🛍 Товары в наличии</h2>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                {loading && <span className='loading-badge'>Загрузка...</span>}
                {!loading && !error && (
                  <>
                    <span className='count-badge'>
                      {filteredProducts.length} товаров
                    </span>
                    {filteredProducts.length !== products.length && (
                      <span className='filtered-badge'>
                        (отфильтровано из {products.length})
                      </span>
                    )}
                  </>
                )}
                {error && <span className='error-badge'>⚠️ {error}</span>}
              </div>
            </div>

            {/* Кнопки быстрого поиска */}
            <div className='quick-search-tags'>
              <span className='quick-search-label'>Быстрый поиск:</span>
              {allCategories.slice(0, 5).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    console.log('🏷️ Быстрый выбор категории:', category);
                    if (!selectedCategories.includes(category)) {
                      setSelectedCategories([...selectedCategories, category]);
                    }
                  }}
                  className='quick-search-tag'
                  aria-label={`Искать ${category}`}
                >
                  {category}
                </button>
              ))}
            </div>

            {loading ? (
              <ProductSkeleton count={8} />
            ) : error ? (
              <div className='error-state'>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    ⚠️
                  </div>
                  <h3 style={{ marginBottom: '12px', color: 'var(--error)' }}>
                    Ошибка загрузки
                  </h3>
                  <p
                    style={{
                      marginBottom: '20px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {error}
                  </p>
                  <button
                    onClick={refreshProducts}
                    style={{
                      padding: '12px 24px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className='empty-products'>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    🔍
                  </div>
                  <h3 style={{ marginBottom: '12px' }}>Товары не найдены</h3>
                  <p
                    style={{
                      marginBottom: '20px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {searchQuery ||
                    selectedCategories.length > 0 ||
                    priceRange[0] > minPrice ||
                    priceRange[1] < maxPrice
                      ? 'Попробуйте изменить параметры поиска'
                      : 'В данный момент товары отсутствуют'}
                  </p>
                  {(searchQuery ||
                    selectedCategories.length > 0 ||
                    priceRange[0] > minPrice ||
                    priceRange[1] < maxPrice) && (
                    <button
                      onClick={() => {
                        resetFilters();
                        resetUrl();
                      }}
                      style={{
                        marginTop: '12px',
                        padding: '10px 20px',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      Сбросить фильтры
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Индикатор фильтрации */}
                {filteredProducts.length !== products.length && (
                  <div
                    style={{
                      padding: '10px',
                      background: '#f0f9ff',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      border: '1px solid #bae6fd',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '14px',
                    }}
                  >
                    <span style={{ color: '#0c4a6e' }}>
                      🔍 Показаны отфильтрованные товары (
                      {filteredProducts.length} из {products.length})
                    </span>
                    <button
                      onClick={resetFilters}
                      style={{
                        padding: '4px 8px',
                        background: '#38bdf8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Показать все
                    </button>
                  </div>
                )}

                <div className='products-grid'>
                  {filteredProducts.map((product) => (
                    <div key={product.id} className='product-card fade-in'>
                      <div className='product-image'>
                        {product.image || '📦'}
                      </div>
                      <div className='product-info'>
                        <h3 className='product-name'>{product.name}</h3>
                        <p className='product-category'>{product.category}</p>
                        {product.inStock === false && (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              fontSize: '10px',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              marginTop: '4px',
                            }}
                          >
                            🔴 Нет в наличии
                          </span>
                        )}
                        <div className='product-footer'>
                          <span className='product-price'>
                            {product.price} ₽
                          </span>
                          <button
                            className='add-to-cart-btn'
                            onClick={() => addToCart(product)}
                            disabled={product.inStock === false}
                            aria-label={`Добавить ${product.name} в корзину`}
                            aria-disabled={product.inStock === false}
                          >
                            {product.inStock === false ? 'Нет' : '➕'}
                            <span className='hide-on-mobile'> В корзину</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {/* Правая колонка - Корзина */}
        <aside className='cart-section slide-up'>
          <div className='section-header'>
            <h2>🛒 Корзина {hasItems && `(${totalItems})`}</h2>
            {hasItems && (
              <button
                className='clear-cart-btn'
                onClick={clearCart}
                aria-label='Очистить корзину'
              >
                Очистить
              </button>
            )}
          </div>

          {!hasItems ? (
            <div className='empty-cart'>
              <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                <div
                  style={{
                    fontSize: '48px',
                    marginBottom: '12px',
                    opacity: 0.5,
                  }}
                >
                  🛒
                </div>
                <p style={{ marginBottom: '4px', fontWeight: '500' }}>
                  Корзина пуста
                </p>
                <small style={{ color: 'var(--text-secondary)' }}>
                  Добавьте товары из списка
                </small>
                {StorageService.getCartCount() > 0 && (
                  <button
                    onClick={() => {
                      if (restoreCart()) {
                        showNotification('Корзина восстановлена', 'success');
                      }
                    }}
                    style={{
                      marginTop: '16px',
                      padding: '10px 20px',
                      background: 'var(--success)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      width: '100%',
                      fontWeight: 'bold',
                    }}
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
              <div className='cart-items'>
                {cart.map((item) => (
                  <div key={item.id} className='cart-item fade-in'>
                    <div className='cart-item-image'>{item.image}</div>
                    <div className='cart-item-details'>
                      <h4>{item.name}</h4>
                      <p className='cart-item-category'>{item.category}</p>
                      <div className='cart-item-controls'>
                        <button
                          className='quantity-btn'
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          aria-label={`Уменьшить количество ${item.name}`}
                        >
                          −
                        </button>
                        <span className='quantity'>{item.quantity} шт</span>
                        <button
                          className='quantity-btn'
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          aria-label={`Увеличить количество ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className='cart-item-right'>
                      <div className='cart-item-price'>
                        {item.price * item.quantity} ₽
                      </div>
                      <button
                        className='remove-btn'
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Удалить ${item.name} из корзины`}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className='cart-summary-details'>
                <div className='summary-row'>
                  <span>Товары ({totalItems} шт)</span>
                  <span>{totalAmount} ₽</span>
                </div>
                <div className='summary-row'>
                  <span>Доставка</span>
                  <span className='free'>Бесплатно</span>
                </div>
                <div className='summary-total'>
                  <span>К оплате:</span>
                  <span className='total-amount'>{totalAmount} ₽</span>
                </div>

                <button
                  className='order-button'
                  onClick={placeOrder}
                  aria-label='Оформить заказ'
                >
                  🚚 Оформить заказ
                </button>

                <p className='delivery-note'>⏱ Доставка за 15-30 минут</p>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#666',
                    textAlign: 'center',
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px dashed #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span>💾</span>
                  <span>Корзина сохраняется автоматически</span>
                </div>
              </div>
            </>
          )}
        </aside>
      </main>

      {/* Подвал */}
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
          <div
            style={{
              fontSize: '12px',
              color: '#666',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <span>🛒 Товаров: {totalItems}</span>
            <span>💰 Сумма: {totalAmount} ₽</span>
            <span>💾 Автосохранение</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

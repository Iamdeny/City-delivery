import React, { useMemo } from 'react';
import type { Product } from '../../types/product';
import type { CartItem } from '../../types/cart';
import ProductCardPremium from './ProductCardPremium';
import './ProductGrid.css';

interface ProductGridProps {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  onRefreshProducts: () => void;
  onResetFilters: () => void;
  searchQuery: string;
  selectedCategories: string[];
  priceRange: [number, number];
  minPrice: number;
  maxPrice: number;
  cart?: CartItem[];
}

function ProductGrid({
  products,
  filteredProducts,
  loading,
  error,
  onAddToCart,
  onRemoveFromCart,
  onRefreshProducts,
  onResetFilters,
  searchQuery,
  selectedCategories,
  priceRange,
  minPrice,
  maxPrice,
  cart = [],
}: ProductGridProps) {
  // Проверяем, какие товары уже в корзине
  const cartProductIds = useMemo(
    () => new Set(cart.map((item) => item.id)),
    [cart]
  );

  // Создаем Map для быстрого доступа к количеству товаров в корзине
  const cartQuantityMap = useMemo(
    () => new Map(cart.map((item) => [item.id, item.quantity])),
    [cart]
  );

  // Мемоизируем отображаемые продукты
  const displayProducts = useMemo(
    () => (filteredProducts.length > 0 ? filteredProducts : products),
    [filteredProducts, products]
  );

  // Мемоизируем проверку наличия фильтров
  const hasFilters = useMemo(
    () =>
      Boolean(
        searchQuery ||
          selectedCategories.length > 0 ||
          priceRange[0] > minPrice ||
          priceRange[1] < maxPrice
      ),
    [searchQuery, selectedCategories.length, priceRange, minPrice, maxPrice]
  );

  if (loading) {
    return (
      <div className='products-section'>
        <div className='section-header'>
          <h2>Товары</h2>
          <div className='loading-badge'>Загрузка...</div>
        </div>
        <div className='loading-products'>
          <div className='spinner'></div>
          <p>Загружаем товары...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isRateLimit = error.includes('429') || error.includes('Слишком много запросов');
    const errorMessage = isRateLimit 
      ? 'Слишком много запросов. Пожалуйста, подождите немного.'
      : error;

    return (
      <div className='products-section'>
        <div className='section-header'>
          <h2>Товары</h2>
          <div className='error-badge'>Ошибка</div>
        </div>
        <div className='error-content'>
          <div className='error-icon'>
            <svg width='48' height='48' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' fill='#FF9800'/>
            </svg>
          </div>
          <p className='error-message'>{errorMessage}</p>
          {isRateLimit && (
            <p className='error-hint'>Попробуйте обновить страницу через несколько секунд.</p>
          )}
          <button onClick={onRefreshProducts} className='retry-button'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z' fill='currentColor'/>
            </svg>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='products-section'>
      <div className='section-header'>
        <h2>Товары</h2>
        <div className='count-badge'>
          {displayProducts.length} из {products.length}
        </div>
      </div>

      {hasFilters && (
        <div className='filtered-indicator'>
          <span>
            Показано {displayProducts.length} товаров
            {searchQuery && ` по запросу "${searchQuery}"`}
            {selectedCategories.length > 0 &&
              ` в категориях: ${selectedCategories.join(', ')}`}
            {(priceRange[0] > minPrice || priceRange[1] < maxPrice) &&
              ` по цене от ${priceRange[0]} до ${priceRange[1]} ₽`}
          </span>
          <button onClick={onResetFilters} className='show-all-button'>
            Показать все
          </button>
        </div>
      )}

      {displayProducts.length === 0 ? (
        <div className='empty-content'>
          <div className='empty-icon'>
            <svg width='64' height='64' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z' fill='#9E9E9E'/>
            </svg>
          </div>
          <h3>Товары не найдены</h3>
          <p>Попробуйте изменить параметры поиска или сбросить фильтры</p>
          <button onClick={onResetFilters} className='reset-filters-button'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z' fill='currentColor'/>
            </svg>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className='products-grid'>
          {displayProducts.map((product) => (
            <ProductCardPremium
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              isInCart={cartProductIds.has(product.id)}
              cartQuantity={cartQuantityMap.get(product.id) || 0}
              discount={0} // Можно добавить логику скидок позже
            />
          ))}
        </div>
      )}

      {products.length > 0 && displayProducts.length === 0 && (
        <div className='empty-products'>
          <p>Товары по вашему запросу не найдены</p>
          <button onClick={onResetFilters} className='reset-filters-button'>
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProductGrid);

import React, { useMemo } from 'react';
import ProductCard from './ProductCard';
import './ProductGrid.css';

interface ProductGridProps {
  products: any[];
  filteredProducts: any[];
  loading: boolean;
  error: string | null;
  onAddToCart: (product: any) => void;
  onRefreshProducts: () => void;
  onResetFilters: () => void;
  searchQuery: string;
  selectedCategories: string[];
  priceRange: [number, number];
  minPrice: number;
  maxPrice: number;
  allCategories: string[];
  onSetSelectedCategories: (categories: string[]) => void;
  onSetSearchQuery: (query: string) => void;
  onSetPriceRange: (range: [number, number]) => void;
  cart?: any[]; // Добавляем корзину для проверки
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  filteredProducts,
  loading,
  error,
  onAddToCart,
  onRefreshProducts,
  onResetFilters,
  searchQuery,
  selectedCategories,
  priceRange,
  minPrice,
  maxPrice,
  allCategories,
  onSetSelectedCategories,
  onSetSearchQuery,
  onSetPriceRange,
  cart = [],
}) => {
  // Проверяем, какие товары уже в корзине
  const cartProductIds = useMemo(() => cart.map((item) => item.id), [cart]);

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
    return (
      <div className='products-section'>
        <div className='section-header'>
          <h2>Товары</h2>
          <div className='error-badge'>Ошибка</div>
        </div>
        <div className='error-content'>
          <div className='error-icon'>⚠️</div>
          <p>{error}</p>
          <button onClick={onRefreshProducts} className='retry-button'>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  const displayProducts =
    filteredProducts.length > 0 ? filteredProducts : products;
  const hasFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    priceRange[0] > minPrice ||
    priceRange[1] < maxPrice;

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
          <div className='empty-icon'>😕</div>
          <p>Товары не найдены</p>
          <small>Попробуйте изменить параметры поиска</small>
          <button onClick={onResetFilters} className='reset-filters-button'>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className='products-grid'>
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              isInCart={cartProductIds.includes(product.id)}
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

export default ProductGrid;

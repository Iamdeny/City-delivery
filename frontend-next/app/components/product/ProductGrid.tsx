/**
 * Product Grid - сетка товаров с фильтрацией
 * Мигрировано из frontend/src/components/Product/ProductGrid.tsx
 */
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { Product, CartItem } from '@/types';
import { useCartProductIds, useCartQuantityMap } from '@/app/hooks/useCartUtils';
import { ProductQuickViewSheet } from './ProductQuickViewSheet';

// Динамический импорт ProductCardPremium для оптимизации bundle size
const ProductCardPremium = dynamic(() => import('./ProductCardPremium'), {
  ssr: true, // SSR включен для SEO
});

interface ProductGridProps {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  onRefreshProducts: () => void;
  onResetFilters: () => void;
  onClearSearch?: () => void;
  popularCategories?: string[];
  onSelectCategory?: (category: string) => void;
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
  onClearSearch,
  popularCategories,
  onSelectCategory,
  searchQuery,
  selectedCategories,
  priceRange,
  minPrice,
  maxPrice,
  cart = [],
}: ProductGridProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Используем централизованные утилиты для работы с корзиной
  const cartProductIds = useCartProductIds(cart);
  const cartQuantityMap = useCartQuantityMap(cart);

  // Создаем ключ для принудительного перерисовывания при изменении корзины
  const cartKey = useMemo(
    () => cart.map((item) => `${item.id}:${item.quantity}`).join(','),
    [cart]
  );

  const quickViewQuantity = quickViewProduct
    ? cartQuantityMap.get(quickViewProduct.id) || 0
    : 0;

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

  // Отображаемые продукты: при активных фильтрах показываем filteredProducts (даже если 0)
  const displayProducts = useMemo(
    () => (hasFilters ? filteredProducts : products),
    [hasFilters, filteredProducts, products]
  );

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="m-0 text-gray-900 text-2xl font-bold">Товары</h2>
          <div className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
            Загрузка...
          </div>
        </div>
        <div className="text-center py-10">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Загружаем товары...</p>
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
      <div className="flex-1 p-6 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="m-0 text-gray-900 text-2xl font-bold">Товары</h2>
          <div className="px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-sm">
            Ошибка
          </div>
        </div>
        <div className="text-center py-10">
          <div className="flex items-center justify-center mb-5">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                fill="#FF9800"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-900 mb-3 leading-relaxed">{errorMessage}</p>
          {isRateLimit && (
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Попробуйте обновить страницу через несколько секунд.
            </p>
          )}
          <button
            onClick={onRefreshProducts}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-xl cursor-pointer font-semibold text-base transition-all shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z"
                fill="currentColor"
              />
            </svg>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 sm:px-6 lg:px-8 pt-3 pb-3 sm:pt-4 sm:pb-4 lg:pt-6 lg:pb-6 bg-transparent lg:bg-transparent rounded-none lg:rounded-lg shadow-none lg:shadow-none">
      <div className="hidden lg:flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="m-0 text-[#1a1a1a] text-[22px] font-extrabold">Товары</h2>
        <div className="px-4 py-2 bg-white text-[#404040] rounded-full text-sm font-semibold border border-gray-200">
          {displayProducts.length} из {products.length}
        </div>
      </div>

      {hasFilters && (
        <div className="hidden lg:flex px-4 py-3.5 bg-blue-50 rounded-lg mb-6 border border-blue-200 justify-between items-center text-sm text-blue-700 backdrop-blur-sm shadow-sm">
          <span>
            Показано {displayProducts.length} товаров
            {searchQuery && ` по запросу "${searchQuery}"`}
            {selectedCategories.length > 0 &&
              ` в категориях: ${selectedCategories.join(', ')}`}
            {(priceRange[0] > minPrice || priceRange[1] < maxPrice) &&
              ` по цене от ${priceRange[0]} до ${priceRange[1]} ₽`}
          </span>
          <button
            onClick={onResetFilters}
            className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer transition-all shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Показать все
          </button>
        </div>
      )}

      {displayProducts.length === 0 ? (
        <div className="text-center py-14 animate-[fadeIn_0.4s_ease]">
          <div className="flex items-center justify-center mx-auto mb-6 w-20 h-20 bg-gray-100 rounded-full opacity-80">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
                fill="#9E9E9E"
              />
            </svg>
          </div>
          <h3 className="m-0 mb-2 text-xl font-semibold text-gray-900">Ничего не найдено</h3>
          <p className="m-0 mb-6 text-sm text-gray-600 leading-relaxed max-w-md mx-auto">
            Попробуйте изменить запрос или фильтры. Мы можем показать популярные категории.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center mb-6">
            {searchQuery.trim() && onClearSearch && (
              <button
                onClick={onClearSearch}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-800 border border-gray-200 rounded-xl cursor-pointer font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                Очистить поиск
              </button>
            )}
            <button
              onClick={onResetFilters}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white border-none rounded-xl cursor-pointer font-semibold text-sm transition-all shadow-md hover:bg-black active:scale-[0.98]"
            >
              Сбросить фильтры
            </button>
          </div>

          {Array.isArray(popularCategories) && popularCategories.length > 0 && onSelectCategory && (
            <div className="max-w-2xl mx-auto">
              <div className="text-xs font-semibold text-gray-600 mb-2">Популярные категории</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {popularCategories.slice(0, 8).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className="px-4 py-2 rounded-[20px] bg-white border border-gray-200 text-sm font-semibold text-gray-800 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <LazyProductGrid
          key={cartKey} // Добавляем key для принудительного перерисовывания при изменении корзины
          products={displayProducts}
          cartProductIds={cartProductIds}
          cartQuantityMap={cartQuantityMap}
          onAddToCart={onAddToCart}
          onRemoveFromCart={onRemoveFromCart}
          onQuickView={(p) => setQuickViewProduct(p)}
        />
      )}

      <ProductQuickViewSheet
        isOpen={Boolean(quickViewProduct)}
        product={quickViewProduct}
        cartQuantity={quickViewQuantity}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
      />
    </div>
  );
}

// Lazy loading компонент для карточек продуктов
function LazyProductGrid({
  products,
  cartProductIds,
  cartQuantityMap,
  onAddToCart,
  onRemoveFromCart,
  onQuickView,
}: {
  products: Product[];
  cartProductIds: Set<number>;
  cartQuantityMap: Map<number, number>;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(12); // Показываем первые 12 сразу
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback для старых браузеров - показываем все сразу
      setVisibleCount(products.length);
      return;
    }

    if (visibleCount >= products.length) return; // Все уже загружены

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsIntersecting(true);

          // Защита от множественных инкрементов, пока sentinel в зоне видимости
          if (isLoadingMoreRef.current) return;
          isLoadingMoreRef.current = true;

          // Загружаем еще 8 карточек
          setVisibleCount((prev) => Math.min(prev + 8, products.length));

          // Разрешаем следующую догрузку после рендера
          requestAnimationFrame(() => {
            isLoadingMoreRef.current = false;
          });
        } else {
          setIsIntersecting(false);
        }
      },
      { rootMargin: '600px' } // Начинаем догрузку заранее (плавнее UX)
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [visibleCount, products.length]);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const LoadingSkeletonCard = ({ keyId }: { keyId: string }) => (
    <div
      key={keyId}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
      aria-hidden="true"
    >
      <div className="w-full aspect-square bg-gray-200 animate-pulse" />
      <div className="p-3 sm:p-4 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse" />
        <div className="h-3.5 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-2/5 animate-pulse" />
        <div className="h-9 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-2 mt-4 lg:mt-6 p-0 animate-[fadeIn_0.3s_ease]">
        {visibleProducts.map((product) => {
          const isInCart = cartProductIds.has(product.id);
          const quantity = cartQuantityMap.get(product.id) || 0;
          // Demo скидки (как в Samokat promo), детерминированно от id
          const discount =
            product.id % 9 === 0 ? 27 : product.id % 7 === 0 ? 25 : product.id % 5 === 0 ? 20 : 0;
          // Используем комбинированный key, который меняется при изменении корзины
          return (
            <ProductCardPremium
              key={`${product.id}-${isInCart}-${quantity}`}
              product={product}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              isInCart={isInCart}
              cartQuantity={quantity}
              discount={discount}
              onQuickView={onQuickView}
            />
          );
        })}

        {/* Samokat-style: skeleton tiles while loading more */}
        {hasMore && isIntersecting && (
          <>
            <LoadingSkeletonCard keyId="sk-1" />
            <LoadingSkeletonCard keyId="sk-2" />
            <LoadingSkeletonCard keyId="sk-3" />
            <LoadingSkeletonCard keyId="sk-4" />
          </>
        )}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="h-10" aria-hidden="true" />
      )}
    </>
  );
}

// Не используем memo, так как нужно перерисовываться при изменении cart
export default ProductGrid;

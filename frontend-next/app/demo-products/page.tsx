/**
 * Демо-страница с продуктами
 * Интеграция всех мигрированных компонентов и хуков
 * Использует: PriceDisplay, QuantityControls, useCartActions, useProductFilters
 */
'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { useProductFilters } from '@/app/hooks/useProductFilters';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { ProductCard } from '@/app/components/product/ProductCard';
import { getPlaceholderByCategory } from '@/lib/placeholders';

// Расширенный набор моковых продуктов для демонстрации
const demoProducts: Product[] = [
  {
    id: 1,
    name: 'Пицца Маргарита',
    price: 599,
    category: 'Пицца',
    inStock: true,
    description: 'Классическая пицца с томатами и моцареллой',
    image: getPlaceholderByCategory('Пицца'),
  },
  {
    id: 2,
    name: 'Пицца Пепперони',
    price: 699,
    category: 'Пицца',
    inStock: true,
    description: 'Острая пицца с пепперони',
    image: getPlaceholderByCategory('Пицца'),
  },
  {
    id: 3,
    name: 'Бургер Классик',
    price: 399,
    category: 'Бургеры',
    inStock: true,
    description: 'Сочный бургер с говядиной',
    image: getPlaceholderByCategory('Бургеры'),
  },
  {
    id: 4,
    name: 'Чизбургер',
    price: 449,
    category: 'Бургеры',
    inStock: true,
    description: 'Бургер с сыром',
    image: getPlaceholderByCategory('Бургеры'),
  },
  {
    id: 5,
    name: 'Салат Цезарь',
    price: 299,
    category: 'Салаты',
    inStock: true,
    description: 'Свежий салат с курицей',
    image: getPlaceholderByCategory('Салаты'),
  },
  {
    id: 6,
    name: 'Греческий салат',
    price: 349,
    category: 'Салаты',
    inStock: true,
    description: 'Свежие овощи с сыром фета',
    image: getPlaceholderByCategory('Салаты'),
  },
  {
    id: 7,
    name: 'Суши сет',
    price: 1299,
    category: 'Суши',
    inStock: false,
    description: 'Набор суши и роллов',
    image: getPlaceholderByCategory('Суши'),
  },
  {
    id: 8,
    name: 'Ролл Филадельфия',
    price: 599,
    category: 'Суши',
    inStock: true,
    description: 'Классический ролл с лососем',
    image: getPlaceholderByCategory('Суши'),
  },
];

export default function DemoProductsPage() {
  // Состояние корзины
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>(
    {}
  );

  // Хук фильтров
  const {
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories,
    filteredProducts,
    hasActiveFilters,
    activeFiltersCount,
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
    resetFilters,
  } = useProductFilters({ products: demoProducts });

  // Вычисляем общую сумму корзины
  const cartTotal = filteredProducts.reduce((sum, product) => {
    const quantity = cartQuantities[product.id] || 0;
    return sum + product.price * quantity;
  }, 0);

  const cartItemsCount = Object.values(cartQuantities).reduce(
    (sum, qty) => sum + qty,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Демо: Каталог товаров</h1>
          <p className="text-gray-600">
            Интеграция всех мигрированных компонентов и хуков
          </p>
        </div>

        {/* Корзина (sticky) */}
        {cartItemsCount > 0 && (
          <div className="sticky top-4 z-10 mb-6">
            <div className="bg-green-500 text-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    В корзине: {cartItemsCount} товар(ов)
                  </p>
                  <PriceDisplay price={cartTotal} size="lg" className="text-white" />
                </div>
                <button className="px-4 py-2 bg-white text-green-500 rounded-lg font-semibold hover:bg-gray-100">
                  Оформить заказ
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Боковая панель фильтров */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Фильтры</h2>

              {/* Поиск */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Поиск
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название товара..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Категории */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Категории
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allCategories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([
                              ...selectedCategories,
                              category,
                            ]);
                          } else {
                            setSelectedCategories(
                              selectedCategories.filter((c) => c !== category)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Цена */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Цена: {priceRange[0]}₽ - {priceRange[1]}₽
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{minPrice}₽</span>
                    <span>{maxPrice}₽</span>
                  </div>
                </div>
              </div>

              {/* Сортировка */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Сортировка
                </label>
                <select
                  value={sortOption}
                  onChange={(e) =>
                    setSortOption(e.target.value as typeof sortOption)
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="relevance">По релевантности</option>
                  <option value="price-asc">Цена: по возрастанию</option>
                  <option value="price-desc">Цена: по убыванию</option>
                  <option value="name-asc">Название: А-Я</option>
                  <option value="name-desc">Название: Я-А</option>
                </select>
              </div>

              {/* Статистика и сброс */}
              <div className="space-y-2">
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Сбросить фильтры ({activeFiltersCount})
                  </button>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Найдено: <strong>{filteredProducts.length}</strong>
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Сетка товаров */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg mb-2">
                  Товары не найдены
                </p>
                <p className="text-sm text-gray-400">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const quantity = cartQuantities[product.id] || 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      quantity={quantity}
                      onAddToCart={() => {
                        setCartQuantities((prev) => ({
                          ...prev,
                          [product.id]: (prev[product.id] || 0) + 1,
                        }));
                      }}
                      onRemoveFromCart={() => {
                        setCartQuantities((prev) => ({
                          ...prev,
                          [product.id]: Math.max(0, (prev[product.id] || 0) - 1),
                        }));
                      }}
                    />
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

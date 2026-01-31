/**
 * Тестовая страница для проверки мигрированных хуков
 * Проверяет useCartActions и useProductFilters
 */
'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { useProductFilters } from '@/app/hooks/useProductFilters';
import { ProductCardSimple } from '@/app/components/product/ProductCardSimple';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { getPlaceholderByCategory } from '@/lib/placeholders';

// Моковые данные для тестирования
const mockProducts: Product[] = [
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
    name: 'Бургер Классик',
    price: 399,
    category: 'Бургеры',
    inStock: true,
    description: 'Сочный бургер с говядиной',
    image: getPlaceholderByCategory('Бургеры'),
  },
  {
    id: 3,
    name: 'Салат Цезарь',
    price: 299,
    category: 'Салаты',
    inStock: true,
    description: 'Свежий салат с курицей',
    image: getPlaceholderByCategory('Салаты'),
  },
  {
    id: 4,
    name: 'Суши сет',
    price: 1299,
    category: 'Суши',
    inStock: false,
    description: 'Набор суши и роллов',
    image: getPlaceholderByCategory('Суши'),
  },
];

export default function TestHooksPage() {
  // Тест useCartActions
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({
    1: 0,
    2: 3,
    3: 1,
    4: 0,
  });

  // Тест useProductFilters
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
  } = useProductFilters({ products: mockProducts });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Тест мигрированных хуков</h1>

      {/* Тест useCartActions */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">useCartActions</h2>
        <p className="text-sm text-gray-600 mb-4">
          Проверка работы хука для действий с корзиной
        </p>

        <div className="space-y-6">
          {mockProducts.map((product) => {
            const quantity = cartQuantities[product.id] || 0;
            return (
              <div key={product.id}>
                <ProductCardSimple
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
                <p className="text-xs text-gray-400 mt-2 ml-4">
                  Текущее значение: {quantity}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Тест useProductFilters */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">useProductFilters</h2>
        <p className="text-sm text-gray-600 mb-4">
          Проверка работы хука для фильтрации и сортировки продуктов
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Фильтры */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Поиск
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск товаров..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Категории
              </label>
              <div className="space-y-2">
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Цена: {priceRange[0]}₽ - {priceRange[1]}₽
              </label>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Сортировка
              </label>
              <select
                value={sortOption}
                onChange={(e) =>
                  setSortOption(e.target.value as typeof sortOption)
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="relevance">По релевантности</option>
                <option value="price-asc">Цена: по возрастанию</option>
                <option value="price-desc">Цена: по убыванию</option>
                <option value="name-asc">Название: А-Я</option>
                <option value="name-desc">Название: Я-А</option>
              </select>
            </div>

            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Сбросить фильтры
            </button>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Активных фильтров:</strong> {activeFiltersCount}
              </p>
              <p className="text-sm">
                <strong>Найдено товаров:</strong> {filteredProducts.length}
              </p>
            </div>
          </div>

          {/* Результаты */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Результаты ({filteredProducts.length})
              </h3>
              {hasActiveFilters && (
                <p className="text-sm text-gray-600">
                  Применены фильтры
                </p>
              )}
            </div>

            <div className="space-y-4">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Товары не найдены
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {product.category}
                        </p>
                        <PriceDisplay price={product.price} size="md" />
                      </div>
                      <div>
                        {product.inStock ? (
                          <span className="text-green-600 text-sm">
                            В наличии
                          </span>
                        ) : (
                          <span className="text-red-600 text-sm">
                            Нет в наличии
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Тестовая страница для Фазы 4
 * Проверка ProductCardPremium и ProductGrid
 */
'use client';

import { useState } from 'react';
import type { Product, CartItem } from '@/types';
import ProductCardPremium from '@/app/components/product/ProductCardPremium';
import ProductGrid from '@/app/components/product/ProductGrid';
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
    name: 'Салат Цезарь',
    price: 299,
    category: 'Салаты',
    inStock: true,
    description: 'Свежий салат с курицей',
    image: getPlaceholderByCategory('Салаты'),
  },
  {
    id: 5,
    name: 'Суши сет',
    price: 1299,
    category: 'Суши',
    inStock: false,
    description: 'Набор суши и роллов',
    image: getPlaceholderByCategory('Суши'),
  },
];

export default function TestPhase4Page() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // Преобразуем Product в CartItem, гарантируя наличие image
      const cartItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        image: product.image || getPlaceholderByCategory(product.category),
        inStock: product.inStock,
        quantity: 1,
      };
      return [...prev, cartItem];
    });
    setCartQuantities((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== product.id);
    });
    setCartQuantities((prev) => {
      const newQuantities = { ...prev };
      if (newQuantities[product.id] > 1) {
        newQuantities[product.id] -= 1;
      } else {
        delete newQuantities[product.id];
      }
      return newQuantities;
    });
  };

  const handleResetFilters = () => {
    // no-op (test page)
  };

  const handleRefreshProducts = () => {
    // no-op (test page)
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Тест Фазы 4: Сложные компоненты</h1>

        {/* Тест ProductCardPremium */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ProductCardPremium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProducts.slice(0, 3).map((product) => (
              <ProductCardPremium
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                isInCart={cartQuantities[product.id] > 0}
                cartQuantity={cartQuantities[product.id] || 0}
                discount={product.id === 1 ? 10 : 0}
              />
            ))}
          </div>
        </section>

        {/* Тест ProductGrid */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">ProductGrid</h2>
          <ProductGrid
            products={mockProducts}
            filteredProducts={mockProducts}
            loading={false}
            error={null}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onRefreshProducts={handleRefreshProducts}
            onResetFilters={handleResetFilters}
            searchQuery=""
            selectedCategories={[]}
            priceRange={[0, 2000]}
            minPrice={0}
            maxPrice={2000}
            cart={cart}
          />
        </section>

        {/* Информация о корзине */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Корзина (для тестирования)</h2>
          <p className="text-gray-600 mb-2">
            Товаров в корзине: <strong>{cart.length}</strong>
          </p>
          <p className="text-gray-600">
            Общее количество: <strong>{cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
          </p>
        </section>
      </div>
    </div>
  );
}

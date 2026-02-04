/**
 * Client Component для главной страницы
 * Premium 2026: HomeHeader, SearchBar, PromoCarousel, CategoryGrid, BottomNav
 */
'use client';

import { useCart } from '@/app/hooks/useCart';
import { useCartItems } from '@/app/hooks/useCartUtils';
import CategoriesSidebar from './CategoriesSidebar';
import ProductSections from './ProductSections';
import DeliveryInfoBar from './DeliveryInfoBar';
import ContentCards from './ContentCards';
import PromotionsSection from './PromotionsSection';
import {
  HomeHeader,
  SearchBar,
  PromoCarousel,
  CategoryGrid,
} from './premium';
import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import type { Product } from '@/types';

interface Category {
  name: string;
  link: string;
  count?: number;
}

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

export default function HomeClient({ products, categories }: HomeClientProps) {
  const { cart, addToCart, decrementQuantity } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams?.get('category');
    return cat ? [cat] : [];
  });

  const handleCategoryChange = (cats: string[]) => {
    setSelectedCategories(cats);
    if (cats.length === 0) {
      router.push('/');
    } else {
      router.push(`/products?category=${encodeURIComponent(cats[0])}`);
    }
  };

  // Мемоизируем имена категорий для оптимизации
  const categoryNames = useMemo(
    () => categories.map(c => c.name),
    [categories]
  );

  // Используем централизованную утилиту для преобразования cart
  const cartItems = useCartItems(cart);

  // Категории для табов (Premium 2026: горизонтальный скролл с активной полоской 2px)
  const homeCategoryChips: string[] = [
    'Акции',
    'Для вас',
    'Фрукты и овощи',
    'Молоко и яйца',
    'Сладкое',
    'Напитки',
  ];

  // Premium 2026: категории для CategoryGrid (id, name, href), активная полоска 2px
  const homeCategoriesForGrid = useMemo(
    () => [
      { id: 'all', name: 'Все', href: '/products' },
      ...homeCategoryChips.map((name) => ({
        id: name,
        name,
        href: `/products?category=${encodeURIComponent(name)}`,
      })),
    ],
    [homeCategoryChips]
  );
  const activeCategoryId = selectedCategories.length > 0 ? selectedCategories[0] : 'all';

  return (
    <div className="min-h-screen">
      {/* Мобильный первый экран — Premium 2026 */}
      <div className="lg:hidden bg-[var(--premium-bg-soft)] min-h-screen">
        <HomeHeader />
        <div
          className="pb-4"
          style={{ paddingLeft: 'var(--premium-margin-mobile)', paddingRight: 'var(--premium-margin-mobile)' }}
        >
          <DeliveryInfoBar />
          <div className="mt-5">
            <SearchBar placeholder="Найти молоко, хлеб, сыр…" href="/products" />
          </div>
          <PromoCarousel />
          <CategoryGrid
            categories={homeCategoriesForGrid}
            activeId={activeCategoryId}
            className="mb-4"
          />
          <ContentCards />
        </div>

      {/* Второй экран: белый фон (только на мобильных), отступ под BottomNav 84px + Safe Area */}
      <motion.div
        className="lg:hidden bg-white rounded-t-[28px] -mt-4 shadow-[0_-10px_26px_rgba(0,0,0,0.10)] pt-4 relative z-10 content-x"
        style={{ paddingBottom: 'calc(84px + var(--safe-bottom))' }}
      >
        <PromotionsSection />
        <ProductSections
          products={products}
          onAddToCart={addToCart}
          onRemoveFromCart={decrementQuantity}
          cart={cartItems}
        />
      </motion.div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:block min-h-screen bg-[#f2f2f2]">
        <div className="max-w-[1440px] mx-auto content-x py-6">
          <div className="flex gap-6">
            {/* Боковое меню категорий */}
            <CategoriesSidebar categories={categories} />

            {/* Основной контент - секции товаров */}
            <main className="flex-1 min-w-0">
              {/* Заголовок страницы */}
              <div className="mb-6">
                <h1 className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight">Доставка от 15 минут</h1>
              </div>

              <ProductSections
                products={products}
                onAddToCart={addToCart}
                onRemoveFromCart={decrementQuantity}
                cart={cartItems}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

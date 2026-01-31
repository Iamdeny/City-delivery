/**
 * Client Component для главной страницы в стиле Самоката
 * Боковое меню категорий + секции товаров
 */
'use client';

import { useCart } from '@/app/hooks/useCart';
import { useCartItems } from '@/app/hooks/useCartUtils';
import CategoriesSidebar from './CategoriesSidebar';
import ProductSections from './ProductSections';
import CategoryNav from '@/app/components/navigation/CategoryNav';
import StoreHoursBar from './StoreHoursBar';
import DeliveryInfoBar from './DeliveryInfoBar';
import ContentCards from './ContentCards';
import MainSearchBar from './MainSearchBar';
import PromotionsSection from './PromotionsSection';
import PromoBannerCarousel from './PromoBannerCarousel';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  const { cart, addToCart } = useCart();
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

  // Refs для отслеживания скролла
  const firstScreenRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  // Вычисляем высоту первого экрана для анимации
  const [firstScreenHeight, setFirstScreenHeight] = useState(0);

  useEffect(() => {
    if (firstScreenRef.current) {
      const updateHeight = () => {
        setFirstScreenHeight(firstScreenRef.current?.offsetHeight || 0);
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => window.removeEventListener('resize', updateHeight);
    }
  }, []);

  // Анимация второго экрана: наезжает на первый при скролле
  // Когда scrollY = 0, translateY = 0 (начальная позиция)
  // Когда scrollY >= firstScreenHeight, translateY = -firstScreenHeight (полностью наехал и закреплен)
  const secondScreenY = useTransform(
    scrollY,
    [0, firstScreenHeight || 1],
    [0, -(firstScreenHeight || 0)],
    {
      clamp: true, // Ограничиваем значение, чтобы не выходило за пределы
    }
  );

  return (
    <div className="min-h-screen">
      {/* Первый экран: серый фон (только на мобильных) */}
      <div ref={firstScreenRef} className="lg:hidden bg-[#f2f2f2]">
        {/* Полоса с часами работы */}
        <StoreHoursBar />

        {/* Блок с адресом доставки */}
        <DeliveryInfoBar />

        {/* Промо-баннеры карусель */}
        <PromoBannerCarousel />

        {/* Большие информационные карточки */}
        <ContentCards />

        {/* Мобильное меню категорий (горизонтальный скролл) */}
        <div className="mb-6 px-4">
          <CategoryNav
            categories={categoryNames}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            singleSelect={true}
          />
        </div>
      </div>

      {/* Второй экран: белый фон, наезжающий на первый (только на мобильных) */}
      <motion.div
        style={{ y: secondScreenY }}
        className="lg:hidden bg-white rounded-t-[28px] -mt-7 shadow-[0_-10px_26px_rgba(0,0,0,0.10)] pt-4 relative z-10"
      >
        {/* Главная поисковая строка - sticky */}
        <div className="sticky top-[calc(var(--mobile-header-h,64px)+var(--safe-top))] z-20 bg-white pb-4 -mx-4 px-4 pt-4">
          <MainSearchBar />
        </div>

        {/* Секция акций */}
        <PromotionsSection />

        {/* Секции товаров */}
        <ProductSections
          products={products}
          onAddToCart={addToCart}
          cart={cartItems}
        />
      </motion.div>

      {/* Десктопная версия */}
      <div className="hidden lg:block min-h-screen bg-[#f2f2f2]">
        <div className="container mx-auto px-4 py-6 max-w-[1440px]">
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
                cart={cartItems}
              />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

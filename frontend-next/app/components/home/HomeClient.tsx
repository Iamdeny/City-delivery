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
import DeliveryInfoBar from './DeliveryInfoBar';
import ContentCards from './ContentCards';
import MainSearchBar from './MainSearchBar';
import PromotionsSection from './PromotionsSection';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { User } from 'lucide-react';
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

  // Порядок чипов как в референсе: Все, Акции, Для вас, Молоко и…
  const homeCategoryChips: string[] = [
    'Акции',
    'Для вас',
    'Фрукты и овощи',
    'Молоко и яйца',
    'Сладкое',
    'Напитки',
  ];

  return (
    <div className="min-h-screen">
      {/* Первый экран: как в референсе Banani / Самокат (только мобильные) */}
      <div ref={firstScreenRef} className="lg:hidden bg-[#fafafa] pb-4">
        {/* Верхняя полоса: HOME DELIVERY + профиль */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a8a8a]">
            Home Delivery
          </span>
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white font-bold text-sm active:scale-95"
            aria-label="Профиль"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
        {/* Блок доставки: время, заголовок, адрес + самокат */}
        <DeliveryInfoBar />

        {/* Поиск под карточкой доставки */}
        <MainSearchBar />

        {/* Промокод — референс: градиент от персикового/розового до бледно-фиолетового */}
        <div className="px-4 mb-4">
          <div className="w-full rounded-[18px] bg-gradient-to-br from-[#ffedf2] via-[#fff2e5] to-[#f3e8ff] p-4 flex items-center justify-between shadow-sm border border-[#ffe0e8]/40">
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-[#1a1a1a]">
                Промокод на первый заказ
              </div>
              <div className="text-[13px] text-[#5a5a5a] mt-0.5">
                Скидка 20% и бесплатная доставка
              </div>
              <div className="mt-2 inline-flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-green-600 text-white text-[11px] font-extrabold tracking-[0.08em]">
                  NEW20
                </span>
                <span className="text-[11px] text-green-600 font-semibold">
                  Только сегодня
                </span>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffccd5] to-[#ffe5b4] flex items-center justify-center shadow-inner">
                <span className="text-2xl" aria-hidden="true">
                  🛍️
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Мобильное меню категорий (горизонтальный скролл) */}
        <div className="mb-4 px-4">
          <CategoryNav
            categories={homeCategoryChips}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
            singleSelect={true}
          />
        </div>

        {/* Подборки от Самоката */}
        <ContentCards />
      </div>

      {/* Второй экран: белый фон, наезжающий на первый (только на мобильных) */}
      <motion.div
        style={{ y: secondScreenY }}
        className="lg:hidden bg-white rounded-t-[28px] -mt-4 shadow-[0_-10px_26px_rgba(0,0,0,0.10)] pt-4 relative z-10"
      >
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

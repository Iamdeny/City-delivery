/**
 * Секции товаров на главной странице (Самокат PWA Mobile)
 * Client Component — оптимизирован под высокую плотность контента и 120Hz экраны
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import dynamic from 'next/dynamic';

// Импортируем нашу оптимизированную карточку товара
const ProductCard = dynamic(() => import('@/app/components/product/ProductCard').then(mod => mod.ProductCard), {
  ssr: true,
  loading: () => <div className="h-[270px] bg-gray-50 rounded-2xl animate-pulse" />,
});

interface ProductSectionsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
  cart?: Array<{ id: number; quantity: number }>;
}

interface EnrichedProductSection {
  title: string;
  link?: string;
  isHorizontalScroll?: boolean;
  items: Array<{
    product: Product;
    quantity: number;
    isPriority: boolean;
  }>;
}

export default function ProductSections({ 
  products, 
  onAddToCart, 
  onRemoveFromCart, 
  cart = [] 
}: ProductSectionsProps) {

  // Хэш-мап для мгновенного O(1) поиска количества товаров в корзине
  const cartMap = useMemo(() => {
    const map = new Map<number, number>();
    cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);

  // Группировка и подготовка данных в одном цикле (минимизируем GC)
  const sections = useMemo(() => {
    if (!products.length) return [];

    const categoryMap = new Map<string, Product[]>();
    const discountedProducts: Product[] = [];

    products.forEach((product, idx) => {
      // Имитируем логику скидок Самоката (каждый 5-й товар)
      const isDiscounted = idx % 5 === 0 || idx % 7 === 0;
      if (isDiscounted && discountedProducts.length < 8) {
        discountedProducts.push(product);
      }

      const category = product.category || 'Другие';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      if (categoryMap.get(category)!.length < 6) {
        categoryMap.get(category)!.push(product);
      }
    });

    const result: EnrichedProductSection[] = [];

    // 1. Выгодная полка (всегда первая, важен LCP приоритет)
    if (discountedProducts.length > 0) {
      result.push({
        title: 'Выгодная полка',
        link: '/products?filter=promotions',
        isHorizontalScroll: true,
        items: discountedProducts.map((p, index) => ({
          product: p,
          quantity: cartMap.get(p.id) || 0,
          isPriority: index < 3, // Первые 3 карточки загружаются мгновенно
        })),
      });
    }

    // 2. Категорийные секции
    categoryMap.forEach((categoryProducts, categoryName) => {
      result.push({
        title: categoryName,
        link: `/products?category=${encodeURIComponent(categoryName)}`,
        isHorizontalScroll: false,
        items: categoryProducts.map(p => ({
          product: p,
          quantity: cartMap.get(p.id) || 0,
          isPriority: false, // Вне зоны первого экрана — lazy-load
        })),
      });
    });

    return result;
  }, [products, cartMap]);

  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm font-medium">
        Товары скоро появятся
      </div>
    );
  }

  return (
    <div className="w-full space-y-7 select-none">
      {sections.map((section) => (
        <section key={section.title} className="w-full">
          
          {/* Заголовок секции в стиле Самоката */}
          <div className="flex items-center justify-between px-4 mb-3">
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight leading-none">
              {section.title}
            </h2>
            {section.link && (
              <Link
                href={section.link}
                className="inline-flex items-center gap-0.5 text-[13px] font-bold text-[#FF2E5B] active:opacity-60 transition-opacity"
              >
                Все
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
            )}
          </div>

          {/* Вариант 1: Горизонтальный скролл (Выгодная Полка) */}
          {section.isHorizontalScroll ? (
            <div className="w-full overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory touch-pan-x">
              {/* Поля px-4 вынесены в паддинг контейнера скролла, чтобы карточки изящно уходили за край экрана */}
              <div className="flex gap-2.5 px-4 w-max">
                {section.items.map(({ product, quantity, isPriority }) => (
                  <div 
                    key={product.id} 
                    className="w-[145px] flex-shrink-0 snap-start"
                  >
                    <ProductCard
                      product={product}
                      quantity={quantity}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      isPriority={isPriority}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Вариант 2: Строгая мобильная двухколоночная сетка */
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {section.items.map(({ product, quantity, isPriority }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  onAddToCart={onAddToCart}
                  onRemoveFromCart={onRemoveFromCart}
                  isPriority={isPriority}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/**
 * Секции товаров на главной странице в стиле Самоката
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import dynamic from 'next/dynamic';

// Динамический импорт для оптимизации
const ProductCardPremium = dynamic(() => import('@/app/components/product/ProductCardPremium'), {
  ssr: true,
});

interface ProductSectionsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  cart?: Array<{ id: number; quantity: number }>;
}

interface ProductSection {
  title: string;
  products: Product[];
  link?: string;
  isHorizontalScroll?: boolean;
}

export default function ProductSections({ products, onAddToCart, onRemoveFromCart, cart = [] }: ProductSectionsProps) {
  const cartMap = useMemo(() => {
    const map = new Map<number, number>();
    cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);

  // Группируем товары по категориям для секций
  const sections = useMemo(() => {
    const categoryMap = new Map<string, Product[]>();
    
    products.forEach(product => {
      const category = product.category || 'Другие';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(product);
    });

    const result: ProductSection[] = [];
    
    // Секция "Выгодная полка" - товары со скидками (горизонтальный скролл)
    const discountedProducts = products.filter((_, idx) => idx % 5 === 0 || idx % 7 === 0 || idx % 9 === 0).slice(0, 8);
    if (discountedProducts.length > 0) {
      result.push({
        title: 'Выгодная полка',
        products: discountedProducts,
        link: '/products',
        isHorizontalScroll: true, // Горизонтальный скролл для этой секции
      });
    }

    // Секции по категориям
    categoryMap.forEach((categoryProducts, categoryName) => {
      if (categoryProducts.length > 0) {
        result.push({
          title: categoryName,
          products: categoryProducts.slice(0, 6),
          link: `/products?category=${encodeURIComponent(categoryName)}`,
        });
      }
    });

    return result;
  }, [products]);

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Товары скоро появятся</p>
      </div>
    );
  }

  // Анимации для секций с задержкой (stagger)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="w-full space-y-8">
      {sections.map((section, sectionIdx) => (
        <motion.section
          key={section.title}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full"
        >
          {/* Заголовок секции — отступ снизу по токену 16px */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight">{section.title}</h2>
            {section.link && (
              <Link
                href={section.link}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-600 hover:text-green-700 transition-colors active:scale-[0.99]"
              >
                Смотреть все
                <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
              </Link>
            )}
          </motion.div>

          {/* Горизонтальный скролл — без выноса за content-x, отступы как у остального контента */}
          {section.isHorizontalScroll ? (
            <div className="overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory lg:overflow-visible lg:snap-none">
              <motion.div
                variants={containerVariants}
                className="flex gap-2.5 sm:gap-3 lg:grid lg:grid-cols-4 xl:grid-cols-6 lg:gap-2 min-w-0"
              >
                {section.products.map((product, idx) => {
                  const quantity = cartMap.get(product.id) || 0;
                  const discount = product.id % 9 === 0 ? 27 : product.id % 7 === 0 ? 25 : product.id % 5 === 0 ? 20 : 0;
                  // Ширина карточки: viewport минус content-x (2×20px на мобильном)
                  return (
                    <motion.div
                      key={product.id}
                      variants={itemVariants}
                      className="flex-shrink-0 w-[calc(100vw-2.5rem)] min-w-[160px] sm:w-[200px] sm:min-w-[200px] lg:w-auto lg:min-w-0 snap-start"
                    >
                      <ProductCardPremium
                        product={product}
                        onAddToCart={onAddToCart}
                        onRemoveFromCart={onRemoveFromCart}
                        isInCart={quantity > 0}
                        cartQuantity={quantity}
                        discount={discount}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          ) : (
            /* Обычная сетка для остальных секций */
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-2"
            >
              {section.products.map((product, idx) => {
                const quantity = cartMap.get(product.id) || 0;
                const discount = product.id % 9 === 0 ? 27 : product.id % 7 === 0 ? 25 : product.id % 5 === 0 ? 20 : 0;
                
                return (
                  <motion.div key={product.id} variants={itemVariants}>
                    <ProductCardPremium
                      product={product}
                      onAddToCart={onAddToCart}
                      onRemoveFromCart={onRemoveFromCart}
                      isInCart={quantity > 0}
                      cartQuantity={quantity}
                      discount={discount}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.section>
      ))}
    </div>
  );
}

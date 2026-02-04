/**
 * Секции товаров на главной странице в стиле Самоката
 */
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { Product } from '@/types';
import dynamic from 'next/dynamic';

// Динамический импорт для оптимизации
const ProductCardPremium = dynamic(() => import('@/app/components/product/ProductCardPremium'), {
  ssr: true,
});

interface ProductSectionsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cart?: Array<{ id: number; quantity: number }>;
}

interface ProductSection {
  title: string;
  products: Product[];
  link?: string;
  isHorizontalScroll?: boolean;
}

export default function ProductSections({ products, onAddToCart, cart = [] }: ProductSectionsProps) {
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

  return (
    <div className="space-y-8 lg:space-y-10">
      {sections.map((section, sectionIdx) => (
        <section key={section.title} className="animate-[fadeIn_0.3s_ease]">
          {/* Заголовок секции */}
          <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
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
          </div>

          {/* Горизонтальный скролл для "Выгодная полка" на мобильных */}
          {section.isHorizontalScroll ? (
            <div className="px-4 lg:px-0">
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide snap-x snap-mandatory lg:grid lg:grid-cols-4 xl:grid-cols-6 lg:gap-2 lg:overflow-visible lg:snap-none">
                {section.products.map((product) => {
                  const quantity = cartMap.get(product.id) || 0;
                  const discount = product.id % 9 === 0 ? 27 : product.id % 7 === 0 ? 25 : product.id % 5 === 0 ? 20 : 0;
                  
                  return (
                    <div key={product.id} className="flex-shrink-0 w-[calc(50vw-20px)] sm:w-[180px] lg:w-auto snap-start">
                      <ProductCardPremium
                        product={product}
                        onAddToCart={onAddToCart}
                        isInCart={quantity > 0}
                        cartQuantity={quantity}
                        discount={discount}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Обычная сетка для остальных секций */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-2 px-4 lg:px-0">
              {section.products.map((product) => {
                const quantity = cartMap.get(product.id) || 0;
                const discount = product.id % 9 === 0 ? 27 : product.id % 7 === 0 ? 25 : product.id % 5 === 0 ? 20 : 0;
                
                return (
                  <ProductCardPremium
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    isInCart={quantity > 0}
                    cartQuantity={quantity}
                    discount={discount}
                  />
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

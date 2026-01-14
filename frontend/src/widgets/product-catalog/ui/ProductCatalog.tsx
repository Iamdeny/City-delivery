/**
 * Widget: Product Catalog
 * Каталог товаров в стиле Bento Grid 2026
 * С поддержкой skeleton screens и optimistic updates
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../../../entities/product/api/useProducts';
import { ProductCard } from '../../../entities/product/ui/ProductCard';
import { ProductCatalogSkeleton } from './ProductCatalogSkeleton';
import type { Product } from '../../../entities/product/model/types';
import './ProductCatalog.css';

interface ProductCatalogProps {
  filters?: {
    searchQuery?: string;
    categories?: string[];
    priceRange?: [number, number];
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'name';
  };
  className?: string;
}

/**
 * Анимация появления карточки
 */
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.9 
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
      type: 'spring' as const,
      stiffness: 100,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 },
  },
};

export function ProductCatalog({ 
  filters = {},
  className = '' 
}: ProductCatalogProps) {
  // React Query для загрузки товаров с валидацией
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useProducts();

  // Фильтрация товаров
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Поиск
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Категории
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((p) => filters.categories!.includes(p.category));
    }

    // Цена
    if (filters.priceRange) {
      const [min, max] = filters.priceRange;
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    // Сортировка
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'name':
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'relevance':
        default:
          // Оставляем порядок по умолчанию
          break;
      }
    }

    return result;
  }, [products, filters]);

  // Skeleton при загрузке
  if (isLoading) {
    return <ProductCatalogSkeleton count={12} className={className} />;
  }

  // Ошибка
  if (error) {
    return (
      <div className={`product-catalog-error ${className}`}>
        <div className="error-icon">⚠️</div>
        <h3>Ошибка загрузки товаров</h3>
        <p>{error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
        <button onClick={() => refetch()} className="retry-button">
          Попробовать снова
        </button>
      </div>
    );
  }

  // Пустой результат
  if (filteredProducts.length === 0) {
    return (
      <div className={`product-catalog-empty ${className}`}>
        <div className="empty-icon">📦</div>
        <h3>Товары не найдены</h3>
        <p>Попробуйте изменить параметры поиска</p>
      </div>
    );
  }

  // Bento Grid сетка
  return (
    <motion.div
      className={`product-catalog ${className}`}
      initial="hidden"
      animate="visible"
    >
      <div className="product-catalog-grid">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

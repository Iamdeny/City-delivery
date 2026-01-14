/**
 * Skeleton Screen для каталога товаров
 * Bento Grid стиль
 */

import React from 'react';
import { motion } from 'framer-motion';
import './ProductCatalogSkeleton.css';

interface ProductCatalogSkeletonProps {
  count?: number;
  className?: string;
}

const skeletonVariants = {
  hidden: { opacity: 0 },
  visible: (index: number) => ({
    opacity: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
    },
  }),
};

export function ProductCatalogSkeleton({ 
  count = 12, 
  className = '' 
}: ProductCatalogSkeletonProps) {
  return (
    <div className={`product-catalog-skeleton ${className}`}>
      <div className="product-catalog-skeleton-grid">
        {Array.from({ length: count }).map((_, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={skeletonVariants}
            initial="hidden"
            animate="visible"
            className="product-card-skeleton"
          >
            {/* Изображение */}
            <div className="skeleton-image" />
            
            {/* Контент */}
            <div className="skeleton-content">
              <div className="skeleton-category" />
              <div className="skeleton-title" />
              <div className="skeleton-title short" />
              <div className="skeleton-footer">
                <div className="skeleton-price" />
                <div className="skeleton-button" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

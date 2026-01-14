/**
 * Entity: Product Card
 * Карточка товара с increment/decrement в карточке
 * Bento Grid стиль 2026
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../cart/model/store';
import { AddToCartButton } from '../../../features/product-add-to-cart/ui/AddToCartButton';
import type { Product } from '../model/types';
import { PriceDisplay } from '../../../shared/ui/PriceDisplay';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  className?: string;
  onQuickView?: (product: Product) => void;
}

// Placeholder изображение
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9C+0LvRg9GH0LjRgtGMINC/0LXRgNC10L3QuNC1PC90ZXh0Pjwvc3ZnPg==';

const createCategoryPlaceholder = (category: string, color: string) => {
  const text = encodeURIComponent(category.substring(0, 15));
  return `https://via.placeholder.com/400x300/${color}/666666?text=${text}`;
};

const DEFAULT_IMAGE = createCategoryPlaceholder('Товар', 'E5E5E5');

const CATEGORY_IMAGES: Record<string, string> = {
  'Молочные продукты': createCategoryPlaceholder('Молочные', 'F0F8FF'),
  Бакалея: DEFAULT_IMAGE,
  Колбасы: createCategoryPlaceholder('Колбасы', 'FFF0F5'),
  'Кофе/Чай': createCategoryPlaceholder('Кофе/Чай', 'F5F5DC'),
  Напитки: createCategoryPlaceholder('Напитки', 'E0F2F1'),
} as const;

export function ProductCard({ 
  product, 
  className = '',
  onQuickView 
}: ProductCardProps) {
  const { getItemQuantity, isInCart } = useCartStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  const quantity = getItemQuantity(product.id);
  const inCart = isInCart(product.id);

  // Мемоизируем изображение
  const productImage = useMemo(() => {
    if (product.image) {
      return product.image;
    }
    return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
  }, [product.image, product.category]);

  // Инициализируем текущий источник изображения
  useEffect(() => {
    setCurrentImageSrc(productImage);
    setImageError(false);
    setImageLoaded(false);
  }, [productImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    if (img.src === PLACEHOLDER_IMAGE || img.src.startsWith('data:')) {
      return;
    }
    
    if (currentImageSrc !== PLACEHOLDER_IMAGE) {
      setImageError(true);
      setCurrentImageSrc(PLACEHOLDER_IMAGE);
      img.src = PLACEHOLDER_IMAGE;
    }
  };

  const handleCardClick = () => {
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <motion.article
      className={`product-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ 
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] // cubic-bezier для плавности
      }}
      onClick={handleCardClick}
      role="article"
      aria-label={`Товар: ${product.name}, цена: ${product.price} рублей`}
    >
      {/* Изображение */}
      <div className="product-card-image">
        {!imageLoaded && !imageError && (
          <div className="product-image-skeleton" />
        )}
        
        <motion.img
          src={currentImageSrc || productImage}
          alt={product.name}
          loading="lazy"
          className={`product-card-img ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Badges */}
        <div className="product-card-badges">
          {product.inStock === false && (
            <div className="out-of-stock-badge">Нет в наличии</div>
          )}
        </div>
      </div>

      {/* Контент */}
      <div className="product-card-content">
        {/* Категория */}
        <div className="product-card-category">{product.category}</div>

        {/* Название */}
        <h3 className="product-card-name" title={product.name} aria-label={`Название товара: ${product.name}`}>
          {product.name}
        </h3>

        {/* Описание */}
        {product.description && (
          <p className="product-card-description" title={product.description}>
            {product.description}
          </p>
        )}

        {/* Footer: Цена + Кнопка */}
        <div className="product-card-footer">
          <div className="product-card-price">
            <PriceDisplay price={product.price} size="md" />
          </div>

          <AddToCartButton 
            product={product} 
            size="medium"
          />
        </div>
      </div>
    </motion.article>
  );
}

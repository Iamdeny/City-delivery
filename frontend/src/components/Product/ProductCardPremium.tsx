/**
 * Premium Product Card - от Gorillas + Getir + Yandex
 * HD images, bold typography, smooth animations
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../shared/types';
import type { ProductComponentProps } from '../../types/common';
import { useCartActions } from '../../shared/hooks/useCartActions';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import { QuantityControls } from '../../shared/ui/QuantityControls';
import './ProductCardPremium.css';

interface ProductCardPremiumProps extends ProductComponentProps {
  product: Product;
  cartQuantity?: number;
  onRemoveFromCart?: (product: Product) => void;
  discount?: number;
  onQuickView?: (product: Product) => void;
}

// Placeholder изображение (data URI) - всегда доступно, не требует интернета
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9C+0LvRg9GH0LjRgtGMINC/0LXRgNC10L3QuNC1PC90ZXh0Pjwvc3ZnPg==';

// Функция для создания placeholder по категории
const createCategoryPlaceholder = (category: string, color: string) => {
  const text = encodeURIComponent(category.substring(0, 15));
  return `https://via.placeholder.com/400x300/${color}/666666?text=${text}`;
};

// Используем placeholder.com как основной источник (более надежный чем Unsplash)
const DEFAULT_IMAGE = createCategoryPlaceholder('Товар', 'E5E5E5');

const CATEGORY_IMAGES: Record<string, string> = {
  'Молочные продукты': createCategoryPlaceholder('Молочные', 'F0F8FF'),
  Бакалея: DEFAULT_IMAGE,
  Колбасы: createCategoryPlaceholder('Колбасы', 'FFF0F5'),
  'Кофе/Чай': createCategoryPlaceholder('Кофе/Чай', 'F5F5DC'),
  Напитки: createCategoryPlaceholder('Напитки', 'E0F2F1'),
} as const;

function ProductCardPremium({ 
  product, 
  onAddToCart, 
  isInCart = false,
  cartQuantity = 0,
  onRemoveFromCart,
  discount,
  onQuickView
}: ProductCardPremiumProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

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
    
    // Если уже используем placeholder - не пытаемся снова
    if (img.src === PLACEHOLDER_IMAGE || img.src.startsWith('data:')) {
      return;
    }
    
    // Если текущий источник - это внешний URL (Unsplash или placeholder.com)
    // и он не загрузился - переключаемся на data URI placeholder
    if (currentImageSrc !== PLACEHOLDER_IMAGE) {
      setImageError(true);
      setCurrentImageSrc(PLACEHOLDER_IMAGE);
      img.src = PLACEHOLDER_IMAGE;
    }
  };

  // Унифицированные обработчики через useCartActions (устранено 4 дубликата)
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    onAddToCart,
    onRemoveFromCart,
    product,
    cartQuantity,
  });

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Вычисляем hasDiscount только для badge (цена обрабатывается в PriceDisplay)
  const hasDiscount = discount && discount > 0;

  return (
    <motion.div 
      className={`product-card-premium ${isInCart ? 'in-cart' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Container (от Gorillas - высокое качество) */}
      <div className='product-image-premium' onClick={handleQuickView}>
        {/* Loading Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="product-image-skeleton" />
        )}
        
        <img
          src={currentImageSrc || productImage}
          alt={product.name}
          loading='lazy'
          className={`product-img-premium ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
        
        {/* Badges */}
        <div className="product-badges">
          {hasDiscount && (
            <motion.div 
              className='discount-badge-premium'
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              −{discount}%
            </motion.div>
          )}
          
          {!product.inStock && (
            <div className='out-of-stock-badge'>
              Нет в наличии
            </div>
          )}
        </div>

        {/* Quick View Hint */}
        <motion.div 
          className="quick-view-hint"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
          </svg>
          <span>Быстрый просмотр</span>
        </motion.div>
      </div>

      {/* Content (от Gorillas - bold typography) */}
      <div className='product-content-premium'>
        {/* Category Badge (от Getir) */}
        <div className='product-category-badge-premium'>
          {product.category}
        </div>

        {/* Name */}
        <h3 className='product-name-premium' title={product.name}>
          {product.name}
        </h3>

        {/* Description (если есть) */}
        {product.description && (
          <p className='product-description-premium' title={product.description}>
            {product.description}
          </p>
        )}

        {/* Footer: Price + Actions */}
        <div className='product-footer-premium'>
          {/* Унифицированный PriceDisplay (устранено 2 дубликата форматирования) */}
          <PriceDisplay price={product.price} discount={discount} size="lg" className="product-price-premium" />

          {/* Унифицированные QuantityControls (устранено 3+ дубликата) */}
          <AnimatePresence mode="wait">
            {cartQuantity > 0 ? (
              <motion.div
                key="quantity-controls"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <QuantityControls
                  quantity={cartQuantity}
                  onIncrement={handleIncrement}
                  onDecrement={handleDecrement}
                  size="md"
                  variant="premium"
                  max={99}
                />
              </motion.div>
            ) : (
              <motion.button
                key="add-button"
                type='button'
                className='add-to-cart-btn-premium'
                onClick={handleAddToCart}
                disabled={!product.inStock}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                aria-label={`Добавить ${product.name} в корзину`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Мемоизация для оптимизации
export default React.memo(ProductCardPremium, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.inStock === nextProps.product.inStock &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.cartQuantity === nextProps.cartQuantity &&
    prevProps.discount === nextProps.discount
  );
});


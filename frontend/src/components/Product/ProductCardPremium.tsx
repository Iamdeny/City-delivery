/**
 * Premium Product Card - от Gorillas + Getir + Yandex
 * HD images, bold typography, smooth animations
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../../types/product';
import type { ProductComponentProps } from '../../types/common';
import './ProductCardPremium.css';

interface ProductCardPremiumProps extends ProductComponentProps {
  product: Product;
  cartQuantity?: number;
  onRemoveFromCart?: (product: Product) => void;
  discount?: number;
  onQuickView?: (product: Product) => void;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80';

const CATEGORY_IMAGES: Record<string, string> = {
  'Молочные продукты':
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop&q=80',
  Бакалея: DEFAULT_IMAGE,
  Колбасы:
    'https://images.unsplash.com/photo-1589225521590-4c6c5a5c8b3e?w=400&h=300&fit=crop&q=80',
  'Кофе/Чай':
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80',
  Напитки:
    'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=400&h=300&fit=crop&q=80',
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

  // Мемоизируем изображение
  const productImage = useMemo(() => {
    if (product.image) {
      return product.image;
    }
    return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
  }, [product.image, product.category]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleDecrement = () => {
    if (onRemoveFromCart && cartQuantity > 0) {
      onRemoveFromCart(product);
    }
  };

  const handleIncrement = () => {
    onAddToCart(product);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  // Вычисляем финальную цену
  const finalPrice = discount ? product.price * (1 - discount / 100) : product.price;
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
          src={productImage}
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
          {/* Price */}
          <div className='product-price-container'>
            {hasDiscount && (
              <span className='product-price-old'>
                {product.price.toLocaleString('ru-RU')}₽
              </span>
            )}
            <span className='product-price-premium'>
              {Math.round(finalPrice).toLocaleString('ru-RU')}₽
            </span>
          </div>

          {/* Add to Cart / Quantity Controls (от Getir - круглые кнопки) */}
          <AnimatePresence mode="wait">
            {cartQuantity > 0 ? (
              <motion.div 
                key="quantity-controls"
                className='quantity-controls-premium'
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <motion.button
                  type='button'
                  className='quantity-btn-premium minus'
                  onClick={handleDecrement}
                  whileTap={{ scale: 0.9 }}
                  aria-label='Уменьшить количество'
                >
                  −
                </motion.button>
                
                <motion.span 
                  className='quantity-value-premium'
                  key={cartQuantity}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {cartQuantity}
                </motion.span>
                
                <motion.button
                  type='button'
                  className='quantity-btn-premium plus'
                  onClick={handleIncrement}
                  whileTap={{ scale: 0.9 }}
                  aria-label='Увеличить количество'
                >
                  +
                </motion.button>
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


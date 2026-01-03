import React, { useMemo } from 'react';
import type { Product } from '../../types/product';
import type { ProductComponentProps } from '../../types/common';
import './ProductCard.css';

interface ProductCardProps extends ProductComponentProps {
  product: Product;
  cartQuantity?: number;
  onRemoveFromCart?: (product: Product) => void;
  discount?: number;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';

const CATEGORY_IMAGES: Record<string, string> = {
  'Молочные продукты':
    'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=200&fit=crop',
  Бакалея: DEFAULT_IMAGE,
  Колбасы:
    'https://images.unsplash.com/photo-1589225521590-4c6c5a5c8b3e?w=300&h=200&fit=crop',
  'Кофе/Чай':
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
  Напитки:
    'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300&h=200&fit=crop',
} as const;

function ProductCard({ 
  product, 
  onAddToCart, 
  isInCart = false,
  cartQuantity = 0,
  onRemoveFromCart,
  discount
}: ProductCardProps) {
  // Мемоизируем изображение для оптимизации
  const productImage = useMemo(() => {
    if (product.image) {
      return product.image;
    }
    return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
  }, [product.image, product.category]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = DEFAULT_IMAGE;
    e.currentTarget.alt = product.name;
  };

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  const handleRemove = () => {
    if (onRemoveFromCart && cartQuantity > 0) {
      onRemoveFromCart(product);
    }
  };

  const handleDecrement = () => {
    if (onRemoveFromCart && cartQuantity > 0) {
      onRemoveFromCart(product);
    }
  };

  const handleIncrement = () => {
    onAddToCart(product);
  };

  return (
    <div className={`product-card ${isInCart ? 'in-cart' : ''}`}>
      <div className='product-image'>
        <img
          src={productImage}
          alt={product.name}
          loading='lazy'
          className='product-img'
          onError={handleImageError}
        />
        {discount && discount > 0 && (
          <div className='discount-badge'>-{discount}%</div>
        )}
        {isInCart && cartQuantity === 0 && <div className='cart-badge'>✓ В корзине</div>}
      </div>

      <div className='product-info'>
        <h3 className='product-name' title={product.name}>
          {product.name}
        </h3>

        <div className='product-category-badge'>{product.category}</div>

        {product.description && (
          <p className='product-description' title={product.description}>
            {product.description}
          </p>
        )}

        <div className='product-footer'>
          <div className='product-price'>
            {product.price.toLocaleString('ru-RU')} ₽
          </div>

          {/* Мобильная версия: кнопки +/- */}
          {cartQuantity > 0 ? (
            <div className='quantity-controls'>
              <button
                type='button'
                className='quantity-btn minus-btn'
                onClick={handleDecrement}
                aria-label='Уменьшить количество'
              >
                −
              </button>
              <span className='quantity-value'>{cartQuantity}</span>
              <button
                type='button'
                className='quantity-btn plus-btn'
                onClick={handleIncrement}
                aria-label='Увеличить количество'
              >
                +
              </button>
            </div>
          ) : (
            <button
              type='button'
              className='add-to-cart-btn'
              onClick={handleAddToCart}
              aria-label={`Добавить ${product.name} в корзину`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Мемоизация с кастомной функцией сравнения для оптимизации
export default React.memo(ProductCard, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.isInCart === nextProps.isInCart &&
    prevProps.cartQuantity === nextProps.cartQuantity &&
    prevProps.discount === nextProps.discount
  );
});

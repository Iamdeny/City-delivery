import React, { useMemo, useState, useEffect } from 'react';
import type { Product } from '../../shared/types';
import type { ProductComponentProps } from '../../types/common';
import { useCartActions } from '../../shared/hooks/useCartActions';
import { PriceDisplay } from '../../shared/ui/PriceDisplay';
import { QuantityControls } from '../../shared/ui/QuantityControls';
import './ProductCard.css';

interface ProductCardProps extends ProductComponentProps {
  product: Product;
  cartQuantity?: number;
  onRemoveFromCart?: (product: Product) => void;
  discount?: number;
}

// Placeholder изображение (data URI) - всегда доступно, не требует интернета
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9C+0LvRg9GH0LjRgtGMINC/0LXRgNC10L3QuNC1PC90ZXh0Pjwvc3ZnPg==';

// Функция для создания placeholder по категории
const createCategoryPlaceholder = (category: string, color: string) => {
  const text = encodeURIComponent(category.substring(0, 15));
  return `https://via.placeholder.com/300x200/${color}/666666?text=${text}`;
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

function ProductCard({ 
  product, 
  onAddToCart, 
  isInCart = false,
  cartQuantity = 0,
  onRemoveFromCart,
  discount
}: ProductCardProps) {
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  // Мемоизируем изображение для оптимизации
  const productImage = useMemo(() => {
    if (product.image) {
      return product.image;
    }
    return CATEGORY_IMAGES[product.category] || DEFAULT_IMAGE;
  }, [product.image, product.category]);

  // Инициализируем текущий источник изображения
  useEffect(() => {
    setCurrentImageSrc(productImage);
  }, [productImage]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    // Если уже используем placeholder - не пытаемся снова
    if (img.src === PLACEHOLDER_IMAGE || img.src.startsWith('data:')) {
      return;
    }
    
    // Переключаемся на data URI placeholder
    if (currentImageSrc !== PLACEHOLDER_IMAGE) {
      setCurrentImageSrc(PLACEHOLDER_IMAGE);
      img.src = PLACEHOLDER_IMAGE;
      img.alt = product.name;
    }
  };

  // Унифицированные обработчики через useCartActions (устранено 4 дубликата)
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    onAddToCart,
    onRemoveFromCart,
    product,
    cartQuantity,
  });

  return (
    <div className={`product-card ${isInCart ? 'in-cart' : ''}`}>
      <div className='product-image'>
        <img
          src={currentImageSrc || productImage}
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
          <PriceDisplay price={product.price} discount={discount} size="md" />
          
          {/* Унифицированные quantity controls (устранено 3+ дубликата) */}
          {cartQuantity > 0 ? (
            <QuantityControls
              quantity={cartQuantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              size="md"
              variant="default"
            />
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

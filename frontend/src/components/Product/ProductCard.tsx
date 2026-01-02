import React from 'react';
import './ProductCard.css';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    category: string;
    image?: string;
    description?: string;
  };
  onAddToCart: (product: any) => void;
  isInCart?: boolean; // ✅ Добавлено
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  isInCart = false,
}) => {
  // Функция для получения изображения товара
  const getProductImage = () => {
    if (product.image) {
      return product.image;
    }

    const categoryImages: Record<string, string> = {
      'Молочные продукты':
        'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=200&fit=crop',
      Бакалея:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop',
      Колбасы:
        'https://images.unsplash.com/photo-1589225521590-4c6c5a5c8b3e?w=300&h=200&fit=crop',
      'Кофе/Чай':
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop',
      Напитки:
        'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=300&h=200&fit=crop',
    };

    return (
      categoryImages[product.category] ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'
    );
  };

  return (
    <div className={`product-card ${isInCart ? 'in-cart' : ''}`}>
      <div className='product-image'>
        <img
          src={getProductImage()}
          alt={product.name}
          loading='lazy'
          className='product-img'
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';
            e.currentTarget.alt = product.name;
          }}
        />
        {isInCart && <div className='cart-badge'>✓ В корзине</div>}
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

          <button
            className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`}
            onClick={() => onAddToCart(product)}
            disabled={isInCart}
            aria-label={
              isInCart
                ? 'Товар уже в корзине'
                : `Добавить ${product.name} в корзину`
            }
          >
            {isInCart ? '✓ В корзине' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProductCard);

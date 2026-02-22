/**
 * Карточка товара
 * Client Component - использует useCartActions hook
 */
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { useCartActions } from '@/app/hooks/useCartActions';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { QuantityControls } from '@/app/components/shared/ui/QuantityControls';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
}

export function ProductCard({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardProps) {
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    product,
    cartQuantity: quantity,
    onAddToCart,
    onRemoveFromCart,
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Изображение */}
      <div className="aspect-video bg-gray-200 relative">
        {product.image ? (
          product.image.startsWith('data:') ? (
            // Для data URI (SVG placeholder'ы) используем обычный img
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
            Нет изображения
          </div>
        )}
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs z-10">
            Нет в наличии
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs text-gray-500">{product.category}</span>
        </div>
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Цена и действия */}
        <div className="flex items-center justify-between">
          <PriceDisplay price={product.price} size="lg" />
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              В корзину
            </button>
          ) : (
            <QuantityControls
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              variant="premium"
              size="md"
            />
          )}
        </div>
      </div>
    </div>
  );
}

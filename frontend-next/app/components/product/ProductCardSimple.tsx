/**
 * Простая карточка товара для тестов
 * Client Component - использует useCartActions hook
 */
'use client';

import type { Product } from '@/types';
import { useCartActions } from '@/app/hooks/useCartActions';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { QuantityControls } from '@/app/components/shared/ui/QuantityControls';

interface ProductCardSimpleProps {
  product: Product;
  quantity: number;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
}

export function ProductCardSimple({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
}: ProductCardSimpleProps) {
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    product,
    cartQuantity: quantity,
    onAddToCart,
    onRemoveFromCart,
  });

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <p className="text-sm text-gray-600">{product.category}</p>
          <PriceDisplay price={product.price} size="md" />
          {!product.inStock && (
            <span className="text-xs text-red-500 ml-2">Нет в наличии</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Добавить
            </button>
          ) : (
            <QuantityControls
              quantity={quantity}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              variant="modern"
              size="md"
            />
          )}
          <span className="text-sm text-gray-500 min-w-[60px]">
            В корзине: {quantity}
          </span>
        </div>
      </div>
    </div>
  );
}

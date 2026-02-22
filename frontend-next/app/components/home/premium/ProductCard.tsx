/**
 * ProductCard — Premium 2026
 * 2 колонки на мобильных (~160–170px). Фото aspect-square, цена Bold,
 * название max 2 строки, кнопка "+" 32×32px в нижнем правом углу (elevation-2).
 * Padding 8px, 4px между ценой и названием.
 */
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { formatPriceWithCurrency } from '@/lib/format';
import { useCartActions } from '@/app/hooks/useCartActions';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import { isValidImageUrl } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  cartQuantity?: number;
  className?: string;
}

export default function ProductCard({
  product,
  onAddToCart,
  onRemoveFromCart,
  cartQuantity = 0,
  className = '',
}: ProductCardProps) {
  const { handleAddToCart } = useCartActions({
    onAddToCart,
    onRemoveFromCart,
    product,
    cartQuantity,
  });

  const imageSrc = product.image && (product.image.startsWith('data:') || product.image.startsWith('/') || isValidImageUrl(product.image))
    ? product.image
    : getPlaceholderByCategory(product.category);

  const isDataUri = imageSrc.startsWith('data:');

  return (
    <article
      className={`bg-white rounded-[var(--premium-radius-card)] overflow-hidden flex flex-col shadow-sm min-h-0 ${className}`}
      style={{
        padding: 'var(--premium-card-padding)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Фото — aspect-square */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[var(--premium-bg-soft)]">
        {isDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 430px) 165px, 180px"
            className="object-contain"
          />
        )}
      </div>

      {/* Цена (Bold) — отступ 4px до названия */}
      <p
        className="text-[15px] font-bold text-[var(--premium-text)] mt-2"
        style={{ marginBottom: 'var(--premium-card-price-name-gap)' }}
      >
        {formatPriceWithCurrency(Number(product.price) || 0)}
      </p>

      {/* Название — max 2 строки */}
      <h3 className="text-[13px] font-medium text-[var(--premium-text)] leading-snug line-clamp-2 flex-1 min-h-[2.5em]">
        {product.name}
      </h3>

      {/* Кнопка "+" 32×32px в нижнем правом углу, elevation-2 */}
      <div className="flex justify-end mt-2">
        {cartQuantity > 0 ? (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--premium-accent)] text-white text-sm font-bold shadow-md">
            {cartQuantity}
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={product.inStock === false}
            className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-[var(--premium-accent)] text-white flex items-center justify-center shadow-md hover:bg-[var(--premium-accent-hover)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }}
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </article>
  );
}

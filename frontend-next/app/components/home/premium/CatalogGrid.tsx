/**
 * CatalogGrid — Premium 2026
 * 2 колонки на мобильных (ширина карточки ~160–170px).
 * Gutter 12px. Заголовки секций: font-weight 700, 20px.
 */
'use client';

import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ContentWrapper from './ContentWrapper';

interface CatalogGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  cart?: Array<{ id: number; quantity: number }>;
  title?: string;
  className?: string;
}

export default function CatalogGrid({
  products,
  onAddToCart,
  onRemoveFromCart,
  cart = [],
  title,
  className = '',
}: CatalogGridProps) {
  const cartMap = new Map(cart.map((c) => [c.id, c.quantity]));

  return (
    <section className={className}>
      {title && (
        <ContentWrapper className="mb-4">
          <h2
            className="text-[var(--premium-section-title-size)] font-bold text-[var(--premium-text)] leading-tight"
            style={{ fontWeight: 700 }}
          >
            {title}
          </h2>
        </ContentWrapper>
      )}
      <ContentWrapper gap="none">
        <div
          className="grid grid-cols-2 gap-3"
          style={{ gap: 'var(--premium-gutter)' }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onRemoveFromCart={onRemoveFromCart}
              cartQuantity={cartMap.get(product.id) ?? 0}
            />
          ))}
        </div>
      </ContentWrapper>
    </section>
  );
}

'use client';

import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import type { Product } from '@/types';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import { PriceDisplay } from '@/app/components/shared/ui/PriceDisplay';
import { QuantityControls } from '@/app/components/shared/ui/QuantityControls';
import { useCartActions } from '@/app/hooks/useCartActions';

export interface ProductQuickViewSheetProps {
  isOpen: boolean;
  product: Product | null;
  cartQuantity: number;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
}

function getProductImage(product: Product) {
  const img = product.image;
  if (img && (img.startsWith('data:') || img.startsWith('/') || img.startsWith('http'))) return img;
  return getPlaceholderByCategory(product.category);
}

export function ProductQuickViewSheet({
  isOpen,
  product,
  cartQuantity,
  onClose,
  onAddToCart,
  onRemoveFromCart,
}: ProductQuickViewSheetProps) {
  const prefersReducedMotion = useReducedMotion();

  const safeProduct = useMemo<Product>(
    () =>
      product ?? ({
        id: -1,
        name: '',
        price: 0,
        category: '',
        inStock: false,
      } as Product),
    [product]
  );

  // Блокируем скролл body, пока открыт sheet
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const imageSrc = useMemo(() => (product ? getProductImage(product) : ''), [product]);

  const actions = useCartActions({
    onAddToCart,
    onRemoveFromCart,
    product: safeProduct,
    cartQuantity,
  });

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          className="fixed inset-0 z-[70]"
          aria-modal="true"
          role="dialog"
          aria-label="Быстрый просмотр товара"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        >
          {/* Overlay */}
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            aria-label="Закрыть"
            onClick={onClose}
            initial={prefersReducedMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          />

          {/* Sheet */}
          <motion.div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 overflow-hidden flex flex-col max-h-[75vh]"
            initial={prefersReducedMotion ? undefined : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReducedMotion ? undefined : { y: '100%' }}
            transition={prefersReducedMotion ? undefined : { type: 'spring', damping: 30, stiffness: 350 }}
            drag={prefersReducedMotion ? false : 'y'}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.08}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 900) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber + close */}
            <div className="relative px-4 pt-3 pb-2">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-gray-200" />
              <button
                type="button"
                className="absolute right-3 top-2 w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center active:scale-95"
                onClick={onClose}
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {/* Image */}
              <div className="px-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="w-full aspect-[4/3] object-cover rounded-2xl bg-gray-100"
                  loading="lazy"
                />
              </div>

              {/* Content */}
              <div className="px-4 pt-4">
                <div className="text-xs font-semibold text-gray-500">
                  {product.category}
                </div>

                <h2 className="mt-2 text-xl font-extrabold text-gray-900 leading-tight">
                  {product.name}
                </h2>

                {product.description && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {!product.inStock && (
                  <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                    Нет в наличии
                  </div>
                )}
                {/* Spacer so content doesn't hide under bottom CTA */}
                <div className="h-28" aria-hidden="true" />
              </div>
            </div>

            {/* Sticky bottom CTA (Samokat-product ref): pink bar with price + plus */}
            <div className="sticky bottom-0 z-10 bg-pink-500 text-white px-4 pt-3 pb-[max(12px,var(--safe-bottom))]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl font-extrabold tabular-nums">
                  <PriceDisplay price={product.price} size="md" />
                </span>

                {cartQuantity > 0 ? (
                  <QuantityControls
                    quantity={cartQuantity}
                    onIncrement={actions.handleIncrement}
                    onDecrement={actions.handleDecrement}
                    size="md"
                    variant="modern"
                    max={99}
                  />
                ) : (
                  <button
                    type="button"
                    className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center active:scale-[0.98] disabled:opacity-60"
                    onClick={actions.handleAddToCart}
                    disabled={!product.inStock}
                    aria-label="Добавить в корзину"
                  >
                    <Plus className="w-7 h-7" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


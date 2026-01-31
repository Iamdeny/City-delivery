/**
 * Компонент списка товаров в корзине
 * Обновлено согласно референсу из design/cart/
 */
'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import type { CartItem } from '@/types';
import { formatPriceWithCurrency } from '@/lib/format';
import { isValidImageUrl } from '@/lib/utils';
import { Minus, Plus, Trash2, X } from 'lucide-react';

interface CartItemsProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onEditItem?: (id: number) => void;
  totalAmount: number;
  totalItems: number;
}

type SwipeConfig = {
  maxLeft: number;
  removeThreshold: number;
};

type CartItemRowProps = {
  item: CartItem;
  index: number;
  isLast: boolean;
  canSwipe: boolean;
  swipe: SwipeConfig;
  reduceMotion: boolean;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onEditItem?: (id: number) => void;
};

function CartItemRow({
  item,
  index,
  isLast,
  canSwipe,
  swipe,
  reduceMotion,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
}: CartItemRowProps) {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, -swipe.maxLeft], [0, 1]);

  const isDataUri = item.image?.startsWith('data:') ?? false;
  const itemTotal = item.price * item.quantity;
  const hasValidImage = isValidImageUrl(item.image);

  // Извлекаем вес из названия (например "Кетчуп Heinz 800 г")
  const weightMatch = item.name.match(/(\d+)\s*(г|кг|ml|л)/i);
  const weightText = weightMatch ? `${weightMatch[1]} ${weightMatch[2]}` : null;
  const productNameWithoutWeight = weightMatch ? item.name.replace(weightMatch[0], '').trim() : item.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
    >
      <div className="relative overflow-hidden">
        {/* Swipe background (revealed on drag) */}
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 z-0 bg-red-500 flex items-center justify-end pr-5 pointer-events-none select-none"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 text-white font-extrabold">
            <Trash2 className="w-5 h-5" />
            <span className="text-sm">Удалить</span>
          </div>
        </motion.div>

        {/* Foreground row */}
        <motion.div
          style={{ x }}
          animate={controls}
          drag={canSwipe ? 'x' : false}
          dragDirectionLock
          dragConstraints={{ left: -swipe.maxLeft, right: 0 }}
          dragElastic={0.08}
          onDragEnd={(_, info) => {
            const shouldRemove = info.offset.x <= -swipe.removeThreshold || info.velocity.x <= -900;
            if (shouldRemove) {
              // Slide away, then remove.
              void controls
                .start({
                  x: -swipe.maxLeft,
                  transition: { duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' },
                })
                .then(() => onRemoveItem(item.id));
              return;
            }
            void controls.start({ x: 0, transition: { duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' } });
          }}
          className="relative z-10 bg-white"
        >
          <div className="flex items-start gap-3 px-4 py-3 bg-white">
            {/* Изображение */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
                {isDataUri ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : hasValidImage ? (
                  <Image
                    src={item.image!}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl bg-gray-100">📦</div>
                )}
              </div>
            </div>

            {/* Контент - в стиле Самоката */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Верхняя строка: название, вес и иконка удаления */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="m-0 text-[15px] font-medium text-gray-800 leading-snug">
                        {productNameWithoutWeight}
                      </h4>
                      {weightText && (
                        <div className="mt-0.5 text-[13px] font-normal text-gray-500">{weightText}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 active:scale-95 transition-colors flex-shrink-0"
                      aria-label={`Удалить ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Нижняя строка: счетчик количества и цены */}
              <div className="flex items-center justify-between gap-3">
                {/* Счетчик количества */}
                <div className="flex items-center rounded-full bg-gray-100 px-1 py-1">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-white text-[#1a1a1a] flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => {
                      if (item.quantity <= 1) onRemoveItem(item.id);
                      else onUpdateQuantity(item.id, item.quantity - 1);
                    }}
                    aria-label={item.quantity <= 1 ? `Удалить ${item.name}` : `Уменьшить количество ${item.name}`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="min-w-[36px] text-center text-[15px] font-semibold text-gray-800">{item.quantity}</div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center active:scale-95 transition-transform"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Увеличить количество ${item.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Цены справа */}
                <div className="flex flex-col items-end gap-0.5">
                  {item.price !== itemTotal && (
                    <span className="text-[13px] font-normal text-gray-400 line-through">
                      {Math.round(item.price).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                  <span className="text-[17px] font-bold text-gray-800 leading-tight">
                    {Math.round(itemTotal).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Разделитель убран в стиле Самоката */}
    </motion.div>
  );
}

function CartItems({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  totalAmount,
  totalItems,
}: CartItemsProps) {
  const reduceMotion = useReducedMotion();
  const [canSwipe, setCanSwipe] = useState(false);

  useEffect(() => {
    // Swipe gestures are primarily for touch devices.
    try {
      const mql = window.matchMedia?.('(pointer: coarse)') ?? null;
      const apply = () => setCanSwipe(Boolean(mql?.matches));
      apply();
      if (!mql) return;

      const legacy = mql as unknown as {
        addListener?: (cb: () => void) => void;
        removeListener?: (cb: () => void) => void;
      };

      if ('addEventListener' in mql) {
        mql.addEventListener('change', apply);
        return () => mql.removeEventListener('change', apply);
      }

      legacy.addListener?.(apply);
      return () => legacy.removeListener?.(apply);
    } catch {
      setCanSwipe(false);
    }
  }, []);

  const swipe = useMemo(
    () => ({
      maxLeft: 96,
      removeThreshold: 64,
    }),
    []
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col bg-white">
      <AnimatePresence initial={false}>
        {items.map((item, index) => (
          <CartItemRow
            key={item.id}
            item={item}
            index={index}
            isLast={index === items.length - 1}
            canSwipe={canSwipe}
            swipe={swipe}
            reduceMotion={Boolean(reduceMotion)}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onEditItem={onEditItem}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export default memo(CartItems);

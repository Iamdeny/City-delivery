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
import { getPlaceholderByCategory } from '@/lib/placeholders';
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
  const hasValidImage = item.image && isValidImageUrl(item.image);
  const imageSrc =
    item.image && (isDataUri || hasValidImage)
      ? item.image
      : getPlaceholderByCategory(item.category ?? 'Прочее');
  const itemTotal = item.price * item.quantity;

  // Извлекаем вес из названия (например "Кетчуп Heinz 800 г")
  const weightMatch = item.name.match(/(\d+)\s*(г|кг|ml|л)/i);
  const weightText = weightMatch ? `${weightMatch[1]} ${weightMatch[2]}` : null;
  const productNameWithoutWeight = weightMatch ? item.name.replace(weightMatch[0], '').trim() : item.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98, x: -100 }}
      transition={{ 
        duration: reduceMotion ? 0 : 0.2,
        type: 'spring',
        stiffness: 300,
        damping: 25
      }}
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
          <div className="flex items-center gap-3 px-5 py-4 bg-white">
            {/* Изображение — квадрат со скруглением по референсу */}
            <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-[#f0f2f5]">
              {imageSrc.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Image
                  src={imageSrc}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Название, вес, цена за единицу — по референсу */}
            <div className="flex-1 min-w-0">
              <h4 className="m-0 text-[15px] font-normal text-[#1a1a1a] leading-snug">
                {productNameWithoutWeight}
              </h4>
              {weightText && (
                <div className="mt-0.5 text-[13px] font-normal text-[#5a5a5a]">{weightText}</div>
              )}
              <div className="mt-1 text-[15px] font-bold text-[#1a1a1a]">
                {Math.round(item.price).toLocaleString('ru-RU')} ₽
              </div>
            </div>

            {/* Счётчик — светлая синяя пилюля как на референсе */}
            <div className="flex items-center rounded-full bg-[#e0f2ff] px-1.5 py-1 flex-shrink-0">
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-white/60 active:scale-95 transition-transform"
                onClick={() => {
                  if (item.quantity <= 1) onRemoveItem(item.id);
                  else onUpdateQuantity(item.id, item.quantity - 1);
                }}
                aria-label={item.quantity <= 1 ? `Удалить ${item.name}` : `Уменьшить количество ${item.name}`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="min-w-[28px] text-center text-[15px] font-bold text-[#1a1a1a]">{item.quantity}</div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#1a1a1a] hover:bg-white/60 active:scale-95 transition-transform"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                aria-label={`Увеличить количество ${item.name}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Справа: удалить, зачёркнутая цена, итог по референсу */}
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#888] hover:text-[#1a1a1a] hover:bg-gray-100 active:scale-95 transition-colors -mt-0.5"
                aria-label={`Удалить ${item.name}`}
              >
                <X className="w-4 h-4" />
              </button>
              {item.price !== itemTotal && (
                <span className="text-[13px] font-normal text-[#999] line-through">
                  {Math.round(item.price).toLocaleString('ru-RU')} ₽
                </span>
              )}
              <span className="text-[15px] font-bold text-[#1a1a1a] leading-tight">
                {Math.round(itemTotal).toLocaleString('ru-RU')} ₽
              </span>
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
    <motion.div 
      className="flex flex-col bg-white"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.05,
          },
        },
      }}
    >
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
    </motion.div>
  );
}

export default memo(CartItems);

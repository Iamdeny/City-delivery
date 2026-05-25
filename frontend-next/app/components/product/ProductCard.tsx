/**
 * Карточка товара — Мобильная версия (Самокат Style)
 * Client Component - оптимизирован для тач-интерфейсов и быстрой отрисовки
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
  isPriority?: boolean; // Для оптимизации LCP первых товаров на экране
}

export function ProductCard({
  product,
  quantity,
  onAddToCart,
  onRemoveFromCart,
  isPriority = false,
}: ProductCardProps) {
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    product,
    cartQuantity: quantity,
    onAddToCart,
    onRemoveFromCart,
  });

  return (
    <div className="flex flex-col justify-between bg-white rounded-2xl p-2.5 h-[270px] active:scale-[0.98] transition-transform select-none border border-gray-100/60">
      
      {/* Изображение: строго 1:1 (square) для мобильной продуктовой сетки */}
      <div className="w-full aspect-square bg-gray-50 rounded-xl relative overflow-hidden flex items-center justify-center">
        {product.image ? (
          product.image.startsWith('data:') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-[85%] h-[85%] object-contain"
              loading={isPriority ? 'eager' : 'lazy'}
            />
          ) : (
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={isPriority}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-contain p-2"
            />
          )
        ) : (
          <div className="text-gray-400 text-[11px] font-medium">Нет фото</div>
        )}
        
        {/* Бейдж отсутствия товара */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="bg-gray-900/80 text-white font-semibold text-[10px] px-2 py-0.5 rounded-md">
              Закончился
            </span>
          </div>
        )}
      </div>

      {/* Информационный блок */}
      <div className="flex flex-col flex-1 justify-between mt-2">
        <div className="space-y-0.5">
          {/* Цена: Всегда сверху над названием по гайдлайнам Самоката */}
          <div className="flex items-baseline gap-1">
            <PriceDisplay price={product.price} size="sm" className="font-extrabold text-[15px] text-gray-900" />
            {/* Пример старой цены, если заложена в типы */}
            {/* <span className="text-[11px] text-gray-400 line-through">120 ₽</span> */}
          </div>

          {/* Название: Жесткий лимит в 2 строки для предотвращения деформации грида */}
          <h3 className="text-[13px] font-normal text-gray-800 leading-tight h-8 line-clamp-2">
            {product.name}
          </h3>
          
          {/* Вес / Объем: Важная фича для продуктов */}
          <span className="block text-[11px] text-gray-400 font-medium">
            {product.description?.slice(0, 15) || '1 шт'} 
          </span>
        </div>

        {/* Интерактивная зона (Кнопка / Контролы) */}
        <div className="mt-2 h-9 w-full">
          {quantity === 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="w-full h-full text-[13px] font-semibold bg-[#FF2E5B] text-white rounded-xl active:bg-[#e0244d] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Добавить
            </button>
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-xl overflow-hidden">
              <QuantityControls
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                variant="minimal" // В Самокате контролы плоские и компактные
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

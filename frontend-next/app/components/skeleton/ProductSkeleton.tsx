/**
 * Skeleton для товаров
 * Мигрировано из frontend/src/components/Skeleton/ProductSkeleton.tsx
 */
'use client';

interface ProductSkeletonProps {
  count?: number;
}

export function ProductSkeleton({ count = 8 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Изображение */}
          <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
          
          {/* Контент */}
          <div className="p-3 sm:p-4 space-y-2.5">
            {/* Название */}
            <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse" />
            
            {/* Категория */}
            <div className="h-3.5 bg-gray-200 rounded w-2/3 animate-pulse" />
            
            {/* Цена */}
            <div className="h-5 bg-gray-200 rounded w-2/5 animate-pulse" />
            
            {/* Кнопка/контрол */}
            <div className="h-9 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

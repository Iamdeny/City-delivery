/**
 * Loading состояние для страницы продуктов
 * Автоматически показывается Next.js при загрузке данных
 */
import { ProductSkeleton } from '@/app/components/skeleton/ProductSkeleton';

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-[var(--safe-top)] lg:pt-0">
      <main className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Skeleton для sidebar */}
          <aside className="flex-shrink-0 hidden lg:block w-64">
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 animate-pulse">
              {/* Заголовок */}
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              
              {/* Категории */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
              
              {/* Цена */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </aside>

          {/* Skeleton для продуктов */}
          <div className="flex-1">
            <div className="bg-gray-50 rounded-lg shadow-sm p-6">
              {/* Заголовок */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
              
              {/* Сетка продуктов */}
              <ProductSkeleton count={12} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Страница продуктов - Server Component
 * Использует server-side data fetching для SEO и производительности
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api/products';
import ProductsClient from './ProductsClient';
import { ProductSkeleton } from '@/app/components/skeleton/ProductSkeleton';
import Breadcrumbs from '@/app/components/navigation/Breadcrumbs';
import type { SortOption } from '@/app/hooks/useProductFilters';

const SORT_OPTIONS: SortOption[] = ['relevance', 'price-asc', 'price-desc', 'name-asc', 'name-desc'];

function parseNumberParam(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function parseSortParam(value: string | undefined): SortOption | undefined {
  if (!value) return undefined;
  return (SORT_OPTIONS as readonly string[]).includes(value) ? (value as SortOption) : undefined;
}

// Динамические метаданные на основе параметров
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; categories?: string; search?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const category = sp.category;
  const categories = sp.categories;
  const search = sp.search;
  
  if (category) {
    return {
      title: `${category} - City Delivery`,
      description: `Товары в категории ${category}. Быстрая доставка за 15 минут.`,
      openGraph: {
        title: `${category} - City Delivery`,
        description: `Товары в категории ${category}`,
        type: 'website',
      },
    };
  }

  if (categories) {
    const list = categories.split(',').filter(Boolean);
    if (list.length > 0) {
      const title = `Категории: ${list.join(', ')} - City Delivery`;
      return {
        title,
        description: `Товары в выбранных категориях: ${list.join(', ')}`,
        openGraph: {
          title,
          description: `Товары в выбранных категориях: ${list.join(', ')}`,
          type: 'website',
        },
      };
    }
  }
  
  if (search) {
    return {
      title: `Поиск: ${search} - City Delivery`,
      description: `Результаты поиска по запросу "${search}"`,
      openGraph: {
        title: `Поиск: ${search} - City Delivery`,
        description: `Результаты поиска по запросу "${search}"`,
        type: 'website',
      },
    };
  }
  
  // Дефолтные метаданные
  return {
    title: 'Каталог товаров - City Delivery',
    description: 'Широкий ассортимент продуктов с быстрой доставкой. Выберите товары и оформите заказ за несколько минут.',
    openGraph: {
      title: 'Каталог товаров - City Delivery',
      description: 'Широкий ассортимент продуктов с быстрой доставкой',
      type: 'website',
    },
  };
}

// Server Component - выполняется на сервере
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; categories?: string; search?: string; minPrice?: string; maxPrice?: string; sort?: string; dark_store_id?: string }>;
}) {
  const sp = await searchParams;
  const initialCategories =
    sp.categories?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  const initialMinPrice = parseNumberParam(sp.minPrice);
  const initialMaxPrice = parseNumberParam(sp.maxPrice);
  const initialSortOption = parseSortParam(sp.sort);
  // Server-side data fetching с ISR кэшированием
  const products = await getProducts({
    darkStoreId: sp.dark_store_id ? parseInt(sp.dark_store_id) : undefined,
  });

  return (
    <div className="min-h-screen bg-[#f2f2f2]">
      <main className="container mx-auto px-4 pt-0 pb-6 md:pt-6 md:pb-6 max-w-[1440px]">
        <div className="hidden lg:block mb-4">
          <Breadcrumbs />
        </div>

        <Suspense fallback={
          <div className="flex gap-6">
            <aside className="flex-shrink-0 hidden lg:block w-64">
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            </aside>
            <div className="flex-1">
              <ProductSkeleton count={12} />
            </div>
          </div>
        }>
          <ProductsClient
            products={products}
            initialCategory={sp.category}
            initialCategories={initialCategories}
            initialSearch={sp.search}
            initialMinPrice={initialMinPrice}
            initialMaxPrice={initialMaxPrice}
            initialSortOption={initialSortOption}
          />
        </Suspense>
      </main>
    </div>
  );
}

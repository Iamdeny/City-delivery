/**
 * Главный компонент страницы категорий
 * Согласно ТЗ: полная структура экрана
 */
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesHeader } from './CategoriesHeader';
import { SearchField } from './SearchField';
import { SectionHeader } from './SectionHeader';
import { CategoryCard } from './CategoryCard';
import { ProductCard } from './ProductCard';
import { ProductRow } from './ProductRow';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import Breadcrumbs from '@/app/components/navigation/Breadcrumbs';
import type { Product } from '@/types';

export interface CategoryStat {
  name: string;
  count: number;
}

export interface CategoriesPageProps {
  categories: CategoryStat[];
  featuredProducts?: Product[];
}

export function CategoriesPage({ categories, featuredProducts = [] }: CategoriesPageProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, searchValue]);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="hidden lg:block container mx-auto px-4 pt-4">
        <Breadcrumbs />
      </div>

      {/* A. ЗАГОЛОВОК */}
      <CategoriesHeader />

      {/* B. ПОЛЕ ПОИСКА */}
      <SearchField 
        value={searchValue}
        onChange={setSearchValue}
        placeholder="Найти категорию..."
      />

      {/* C. СЕКЦИЯ "CATEGORIES" */}
      <div>
        <SectionHeader title="Категории" />

        {filteredCategories.length === 0 ? (
          <div className="mx-4 p-4 bg-white rounded-xl border border-gray-100 text-gray-700">
            <div className="font-semibold mb-1">Ничего не найдено</div>
            <div className="text-sm text-gray-600 mb-3">
              Попробуйте изменить запрос поиска.
            </div>
            <button
              type="button"
              onClick={() => setSearchValue('')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold"
            >
              Очистить поиск
            </button>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCategories.map((cat) => (
              <CategoryCard
                key={cat.name}
                title={cat.name}
                count={cat.count}
                onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* D. СЕКЦИЯ "FEATURED" */}
      {featuredProducts.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Популярное" />

          <div className="flex gap-3 px-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {featuredProducts.slice(0, 8).map((p) => (
              <ProductCard
                key={p.id}
                name={p.name}
                subtitle={p.category}
                price={p.price}
                image={p.image ?? getPlaceholderByCategory(p.category)}
                onClick={() => router.push(`/products?search=${encodeURIComponent(p.name)}`)}
              />
            ))}
          </div>

          {featuredProducts[0] && (
            <div className="mt-4">
              <ProductRow
                name={featuredProducts[0].name}
                description={featuredProducts[0].category}
                price={featuredProducts[0].price}
                onClick={() => router.push(`/products?search=${encodeURIComponent(featuredProducts[0].name)}`)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

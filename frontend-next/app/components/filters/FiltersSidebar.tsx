/**
 * FiltersSidebar - боковая панель фильтров
 * Мигрировано из frontend/src/components/Filters/FiltersSidebar.tsx
 */
'use client';

import { CategoryFilter } from './CategoryFilter';
import { PriceFilter } from './PriceFilter';
import type { SortOption } from '@/app/hooks/useProductFilters';
import { RotateCcw } from 'lucide-react';

interface FiltersSidebarProps {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onResetFilters: () => void;
  productsCount: number;
  filteredProductsCount: number;
  variant?: 'sidebar' | 'drawer';
}

export default function FiltersSidebar({
  minPrice,
  maxPrice,
  priceRange,
  onPriceChange,
  categories,
  selectedCategories,
  onCategoryChange,
  sortOption,
  onSortChange,
  onResetFilters,
  productsCount,
  filteredProductsCount,
  variant = 'sidebar',
}: FiltersSidebarProps) {
  const isDrawer = variant === 'drawer';

  return (
    <aside
      className={
        isDrawer
          ? 'bg-white p-0 rounded-none shadow-none h-auto min-w-0'
          : 'bg-[#f2f2f2] p-5 rounded-lg shadow-sm h-fit min-w-[250px]'
      }
    >
      {isDrawer ? (
        <button
          onClick={onResetFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-colors hover:bg-red-600"
          aria-label="Сбросить все фильтры"
        >
          <RotateCcw className="w-4 h-4" />
          Сбросить все фильтры
        </button>
      ) : (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="m-0 text-[22px] font-extrabold text-[#1a1a1a]">Фильтры</h3>
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#1a1a1a] border border-gray-200 rounded-full text-xs font-semibold cursor-pointer transition-colors hover:bg-gray-50 active:scale-95"
            aria-label="Сбросить все фильтры"
          >
            <RotateCcw className="w-3 h-3" />
            Сбросить всё
          </button>
        </div>
      )}

      {/* Фильтр по цене */}
      <PriceFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentMin={priceRange[0]}
        currentMax={priceRange[1]}
        onPriceChange={(min, max) => onPriceChange([min, max])}
      />

      {/* Фильтр по категориям */}
      <CategoryFilter
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={onCategoryChange}
      />

      {/* Сортировка */}
      <div className="my-6">
        <h3 className="m-0 mb-3 text-base font-extrabold text-[#1a1a1a]">Сортировка</h3>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
          style={{
            fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
          }}
          aria-label="Сортировка товаров"
        >
          <option value="relevance">По релевантности</option>
          <option value="price-asc">Цена: по возрастанию</option>
          <option value="price-desc">Цена: по убыванию</option>
          <option value="name-asc">Название: А-Я</option>
          <option value="name-desc">Название: Я-А</option>
        </select>
      </div>

      {/* Статистика */}
      <div className={`${isDrawer ? 'mt-4' : 'mt-6'} p-4 bg-white rounded-[18px] border border-gray-100`}>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-semibold text-[#404040]">Всего товаров:</span>
          <span className="text-sm font-extrabold text-[#1a1a1a]">{productsCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-[#404040]">Показано:</span>
          <span
            className={`text-sm font-extrabold ${
              filteredProductsCount !== productsCount
                ? 'text-[#ff3363]'
                : 'text-[#1a1a1a]'
            }`}
          >
            {filteredProductsCount}
          </span>
        </div>
      </div>
    </aside>
  );
}

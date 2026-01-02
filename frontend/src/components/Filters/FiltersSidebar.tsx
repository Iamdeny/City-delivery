import React from 'react';
import { CategoryFilter } from '../Filter/CategoryFilter';
import { PriceFilter } from '../Filter/PriceFilter';
import { SortOption } from '../../hooks/useProductFilters';
import './FiltersSidebar.css';

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
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
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
}) => {
  return (
    <aside className='filters-sidebar'>
      <div className='filters-header'>
        <h3>Фильтры</h3>
        <button
          onClick={onResetFilters}
          className='reset-filters-btn'
          aria-label='Сбросить все фильтры'
        >
          Сбросить всё
        </button>
      </div>

      {/* Фильтр по цене */}
      <PriceFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentMin={priceRange[0]}
        currentMax={priceRange[1]}
        onPriceChange={(min, max) => onPriceChange([min, max])} // Адаптируем вызов
      />

      {/* Фильтр по категориям */}
      <CategoryFilter
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={onCategoryChange}
      />

      {/* Сортировка */}
      <div className='sort-filter'>
        <h3 className='filter-title'>Сортировка</h3>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className='sort-select'
          aria-label='Сортировка товаров'
        >
          <option value='relevance'>По релевантности</option>
          <option value='price-asc'>Цена: по возрастанию</option>
          <option value='price-desc'>Цена: по убыванию</option>
          <option value='name-asc'>Название: А-Я</option>
          <option value='name-desc'>Название: Я-А</option>
        </select>
      </div>

      {/* Статистика */}
      <div className='filter-stats'>
        <div className='stat-item'>
          <span className='stat-label'>Всего товаров:</span>
          <span className='stat-value'>{productsCount}</span>
        </div>
        <div className='stat-item'>
          <span className='stat-label'>Показано:</span>
          <span
            className={`stat-value ${
              filteredProductsCount !== productsCount ? 'filtered' : ''
            }`}
          >
            {filteredProductsCount}
          </span>
        </div>
      </div>
    </aside>
  );
};

export default FiltersSidebar;

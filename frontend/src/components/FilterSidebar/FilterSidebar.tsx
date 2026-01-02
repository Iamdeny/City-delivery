import React from 'react';
import './FilterSidebar.css';
import { SortOption } from '../../hooks/useProductFilters';

interface FilterSidebarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availableCategories: string[];
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onReset: () => void;
  filterStats: {
    total: number;
    filtered: number;
    isFiltered: boolean;
  };
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  priceRange,
  onPriceChange,
  sortOption,
  onSortChange,
  onReset,
  filterStats,
}) => {
  return (
    <aside className='filter-sidebar'>
      <div className='filter-header'>
        <h3>Фильтры</h3>
        {filterStats.isFiltered && (
          <button className='reset-btn' onClick={onReset}>
            Сбросить
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className='filter-group'>
        <label htmlFor='search'>Поиск</label>
        <input
          id='search'
          type='text'
          placeholder='Название или описание...'
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Категория */}
      <div className='filter-group'>
        <label htmlFor='category'>Категория</label>
        <select
          id='category'
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          {availableCategories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'Все категории' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Цена */}
      <div className='filter-group'>
        <label>
          Цена: {priceRange[0]} - {priceRange[1]} ₽
        </label>
        <div className='price-inputs'>
          <input
            type='number'
            placeholder='От'
            value={priceRange[0]}
            onChange={(e) =>
              onPriceChange([Number(e.target.value), priceRange[1]])
            }
            min='0'
          />
          <input
            type='number'
            placeholder='До'
            value={priceRange[1]}
            onChange={(e) =>
              onPriceChange([priceRange[0], Number(e.target.value)])
            }
            min='0'
          />
        </div>
      </div>

      {/* Сортировка */}
      <div className='filter-group'>
        <label htmlFor='sort'>Сортировка</label>
        <select
          id='sort'
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          <option value='name_asc'>По имени (А-Я)</option>
          <option value='name_desc'>По имени (Я-А)</option>
          <option value='price_asc'>По возрастанию цены</option>
          <option value='price_desc'>По убыванию цены</option>
        </select>
      </div>

      {/* Статистика */}
      <div className='filter-stats'>
        Найдено: {filterStats.filtered} из {filterStats.total}
      </div>
    </aside>
  );
};

export default FilterSidebar;

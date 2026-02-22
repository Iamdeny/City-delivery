/**
 * CategoryFilter - фильтр по категориям
 * Мигрировано из frontend/src/components/Filter/CategoryFilter.tsx
 */
'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoryChange,
}: CategoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Мемоизируем уникальные категории и их количество для оптимизации
  const { uniqueCategories, categoryCountMap } = useMemo(() => {
    const unique = Array.from(new Set(categories)).sort();
    const countMap = new Map<string, number>();
    categories.forEach(cat => {
      countMap.set(cat, (countMap.get(cat) || 0) + 1);
    });
    return { uniqueCategories: unique, categoryCountMap: countMap };
  }, [categories]);

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    onCategoryChange(newCategories);
  };

  const handleSelectAll = () => {
    onCategoryChange(uniqueCategories);
  };

  const handleClearAll = () => {
    onCategoryChange([]);
  };

  const visibleCategories = isExpanded
    ? uniqueCategories
    : uniqueCategories.slice(0, 5);

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="m-0 text-base font-bold text-gray-800">Категории</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            aria-label="Выбрать все категории"
          >
            Все
          </button>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
            aria-label="Очистить все категории"
          >
            Сброс
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {visibleCategories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          const count = categoryCountMap.get(category) || 0;

          return (
            <label
              key={category}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 text-[#ff3363] border-gray-300 rounded focus:ring-pink-500 focus:ring-2"
                aria-label={`Категория: ${category}`}
              />
              <span className="flex-1 text-sm text-gray-700">{category}</span>
              <span className="text-xs text-gray-500">({count})</span>
            </label>
          );
        })}
      </div>

      {uniqueCategories.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-[#ff3363] hover:text-[#ff1a52] py-2 rounded transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Скрыть
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Показать все ({uniqueCategories.length})
            </>
          )}
        </button>
      )}

      {selectedCategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="text-xs text-gray-600 mb-2 block">Выбрано: </span>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 px-2 py-1 bg-pink-50 text-[#ff3363] text-xs rounded-full"
              >
                {category}
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className="hover:bg-pink-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Убрать категорию ${category}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

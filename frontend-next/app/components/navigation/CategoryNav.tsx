'use client';

import { useMemo } from 'react';

// Иконки для категорий (наследуем маппинг из старого фронта)
const CATEGORY_ICONS: Record<string, string> = {
  'Хлеб и выпечка': '🍞',
  'Мясо и рыба': '🐟',
  Морозилка: '❄️',
  'Вода и напитки': '💧',
  Сладкое: '🍫',
  Снеки: '🥨',
  Бакалея: '📦',
  'Для детей': '🍼',
  'Для животных': '🐾',
  'Красота и здоровье': '❤️',
  'Одежда, обувь и аксессуары': '👔',
  'Всё для дома': '🏠',
  'Книги, канцелярия и хобби': '📚',
  'Спорт и туризм': '🏋️',
  'Техника и электроника': '💻',
  'Для автомобиля': '🚗',
  'Молочные продукты': '🥛',
  Яйца: '🥚',
  'Овощи и фрукты': '🥕',
  'Замороженные продукты': '🧊',
};

export interface CategoryNavProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  className?: string;
  singleSelect?: boolean;
}

export default function CategoryNav({
  categories,
  selectedCategories,
  onCategoryChange,
  className = '',
  singleSelect = false,
}: CategoryNavProps) {
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(categories)).filter(Boolean).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [categories]);

  const isAllActive = selectedCategories.length === 0;

  const toggleCategory = (category: string) => {
    const isSelected = selectedCategories.includes(category);

    // На мобилке как у Самоката: быстрый одиночный выбор категории
    if (singleSelect) {
      onCategoryChange(isSelected ? [] : [category]);
      return;
    }

    // Десктоп/сайдбар: мультивыбор
    const next = isSelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoryChange(next);
  };

  return (
    <nav
      aria-label="Категории"
      className={`w-full ${className}`}
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-hide snap-x snap-mandatory">
        <button
          type="button"
          onClick={() => onCategoryChange([])}
          className={`flex-shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold border transition-colors snap-start ${
            isAllActive
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-white text-[#1a1a1a] border-gray-200 hover:border-gray-300 active:scale-95'
          }`}
          aria-pressed={isAllActive}
        >
          <span className="text-[14px] leading-none">✨</span>
          Все
        </button>

        {uniqueCategories.map((category) => {
          const active = selectedCategories.includes(category);
          const icon = CATEGORY_ICONS[category] ?? '📦';
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`flex-shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold border transition-colors snap-start ${
                active
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-[#1a1a1a] border-gray-200 hover:border-gray-300 active:scale-95'
              }`}
              aria-pressed={active}
              aria-label={`Категория: ${category}`}
            >
              <span className="text-[14px] leading-none">{icon}</span>
              <span className="whitespace-nowrap">{category}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}


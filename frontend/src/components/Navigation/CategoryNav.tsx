/**
 * Навигационное меню категорий в стиле Самоката
 */

import React from 'react';
import './CategoryNav.css';

interface CategoryNavProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryClick: (category: string) => void;
}

// Иконки для категорий
const CATEGORY_ICONS: Record<string, string> = {
  'Хлеб и выпечка': '🍞',
  'Мясо и рыба': '🐟',
  'Морозилка': '❄️',
  'Вода и напитки': '💧',
  'Сладкое': '🍫',
  'Снеки': '🥨',
  'Бакалея': '📊',
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
  'Яйца': '🥚',
  'Овощи и фрукты': '🥕',
  'Замороженные продукты': '🧊',
};

const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategories,
  onCategoryClick,
}) => {
  const uniqueCategories = Array.from(new Set(categories)).sort();

  const getCategoryIcon = (category: string): string => {
    return CATEGORY_ICONS[category] || '📦';
  };

  return (
    <nav className='category-nav'>
      <ul className='category-nav-list'>
        {uniqueCategories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <li key={category} className='category-nav-item'>
              <button
                onClick={() => onCategoryClick(category)}
                className={`category-nav-link ${isSelected ? 'active' : ''}`}
                aria-label={`Категория: ${category}`}
              >
                <span className='category-nav-icon'>{getCategoryIcon(category)}</span>
                <span className='category-nav-name'>{category}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategoryNav;


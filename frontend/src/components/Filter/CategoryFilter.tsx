import React, { useState } from 'react';
import './CategoryFilter.css';

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const uniqueCategories = Array.from(new Set(categories)).sort();

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
    <div className='category-filter'>
      <div className='filter-header'>
        <h3 className='filter-title'>Категории</h3>
        <div className='filter-actions'>
          <button
            onClick={handleSelectAll}
            className='filter-action-btn'
            aria-label='Выбрать все категории'
          >
            Все
          </button>
          <button
            onClick={handleClearAll}
            className='filter-action-btn'
            aria-label='Очистить все категории'
          >
            Сброс
          </button>
        </div>
      </div>

      <div className='categories-list'>
        {visibleCategories.map((category) => (
          <label key={category} className='category-checkbox'>
            <input
              type='checkbox'
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryToggle(category)}
              className='checkbox-input'
              aria-label={`Категория: ${category}`}
            />
            <span className='checkbox-custom'></span>
            <span className='category-name'>{category}</span>
            <span className='category-count'>
              ({categories.filter((c) => c === category).length})
            </span>
          </label>
        ))}
      </div>

      {uniqueCategories.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='expand-categories-btn'
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Скрыть' : `Показать все (${uniqueCategories.length})`}
        </button>
      )}

      {selectedCategories.length > 0 && (
        <div className='selected-categories'>
          <span className='selected-label'>Выбрано: </span>
          <div className='selected-tags'>
            {selectedCategories.map((category) => (
              <span key={category} className='selected-tag'>
                {category}
                <button
                  onClick={() => handleCategoryToggle(category)}
                  className='remove-tag-btn'
                  aria-label={`Убрать категорию ${category}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

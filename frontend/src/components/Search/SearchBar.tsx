import React, { useState, useEffect, useRef, useMemo } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number;
  suggestions?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Поиск товаров...',
  delay = 300,
  suggestions = [],
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Дебаунс поиска (используем useRef для стабильности onSearch)
  const onSearchRef = useRef(onSearch);
  const prevQueryRef = useRef(query);
  
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    // Пропускаем вызов, если значение не изменилось
    if (query === prevQueryRef.current) {
      return;
    }
    
    const timer = setTimeout(() => {
      // Обновляем ref только после вызова, чтобы избежать повторных вызовов
      prevQueryRef.current = query;
      onSearchRef.current(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Мемоизируем строковое представление suggestions для стабильности
  const suggestionsKey = useMemo(
    () => suggestions.join(','),
    [suggestions] // ← Зависимость от массива, но сравниваем по содержимому
  );

  // Фильтрация предложений
  useEffect(() => {
    if (query.trim() && suggestions.length > 0) {
      const filtered = suggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, suggestionsKey]); // ← Используем строковое представление вместо массива!

  // Закрытие предложений при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className='search-bar' ref={searchRef}>
      <div className='search-input-wrapper'>
        <div className='search-icon'>
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z'
              fill='currentColor'
            />
          </svg>
        </div>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className='search-input'
          aria-label='Поиск товаров'
        />
        {query && (
          <button
            onClick={handleClear}
            className='clear-search-btn'
            aria-label='Очистить поиск'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z'
                fill='currentColor'
              />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className='suggestions-dropdown'>
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className='suggestion-item'
              onClick={() => handleSuggestionClick(suggestion)}
              role='button'
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              <span className='suggestion-text'>{suggestion}</span>
              <span className='suggestion-hint'>Нажмите для поиска</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

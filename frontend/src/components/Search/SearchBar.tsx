import React, { useState, useEffect, useRef } from 'react';
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

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay, onSearch]);

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
  }, [query, suggestions]);

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
        <div className='search-icon'>🔍</div>
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
            ✕
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

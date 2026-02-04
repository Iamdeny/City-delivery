/**
 * Компонент поиска
 * Мигрировано из frontend/src/components/Search/SearchBar.tsx
 */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  value?: string;
  onChange?: (query: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  placeholder?: string;
  delay?: number;
  suggestions?: string[];
  className?: string;
}

export function SearchBar({
  onSearch,
  value,
  onChange,
  inputRef,
  placeholder = 'Поиск товаров...',
  delay = 300,
  suggestions = [],
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(value ?? '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Дебаунс поиска
  const onSearchRef = useRef(onSearch);
  const prevQueryRef = useRef(query);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Синхронизация контролируемого значения (если передан value)
  useEffect(() => {
    if (typeof value === 'string' && value !== query) {
      setQuery(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (query === prevQueryRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      prevQueryRef.current = query;
      onSearchRef.current(query);
    }, delay);

    return () => clearTimeout(timer);
  }, [query, delay]);

  // Мемоизируем строковое представление suggestions
  const suggestionsKey = useMemo(
    () => suggestions.join(','),
    [suggestions]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, suggestionsKey]);

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
    onChange?.(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    onChange?.('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onChange?.(next);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all"
          aria-label="Поиск товаров"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
            aria-label="Очистить поиск"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex justify-between items-center"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              <span className="text-gray-900">{suggestion}</span>
              <span className="text-xs text-gray-500">Нажмите для поиска</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

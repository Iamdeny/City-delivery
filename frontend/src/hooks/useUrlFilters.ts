import { useState, useEffect, useCallback } from 'react';
import { SortOption } from './useProductFilters';

interface UrlFilters {
  search: string;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
}

interface UseUrlFiltersProps {
  initialFilters: Omit<UrlFilters, 'minPrice' | 'maxPrice'> & {
    priceRange: [number, number];
  };
  onFiltersChange: (filters: UrlFilters) => void;
}

export const useUrlFilters = ({
  initialFilters,
  onFiltersChange,
}: UseUrlFiltersProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  // Функция для преобразования фильтров в URL параметры
  const filtersToUrlParams = useCallback(
    (filters: UrlFilters) => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.set('search', filters.search);
      }

      if (filters.categories.length > 0) {
        params.set('categories', filters.categories.join(','));
      }

      if (filters.minPrice > initialFilters.priceRange[0]) {
        params.set('min_price', filters.minPrice.toString());
      }

      if (filters.maxPrice < initialFilters.priceRange[1]) {
        params.set('max_price', filters.maxPrice.toString());
      }

      if (filters.sort !== 'relevance') {
        params.set('sort', filters.sort);
      }

      return params.toString();
    },
    [initialFilters.priceRange]
  );

  // Функция для парсинга URL параметров в фильтры
  const urlParamsToFilters = useCallback(
    (searchParams: URLSearchParams): UrlFilters => {
      const search = searchParams.get('search') || '';
      const categoriesParam = searchParams.get('categories') || '';
      const categories = categoriesParam
        ? categoriesParam.split(',').filter(Boolean)
        : [];
      const minPrice =
        Number(searchParams.get('min_price')) || initialFilters.priceRange[0];
      const maxPrice =
        Number(searchParams.get('max_price')) || initialFilters.priceRange[1];
      const sort = (searchParams.get('sort') as SortOption) || 'relevance';

      return {
        search,
        categories,
        minPrice: Math.max(minPrice, initialFilters.priceRange[0]),
        maxPrice: Math.min(maxPrice, initialFilters.priceRange[1]),
        sort: [
          'relevance',
          'price-asc',
          'price-desc',
          'name-asc',
          'name-desc',
        ].includes(sort)
          ? sort
          : 'relevance',
      };
    },
    [initialFilters.priceRange]
  );

  // Обновляем URL при изменении фильтров
  const updateUrl = useCallback(
    (filters: UrlFilters) => {
      const params = filtersToUrlParams(filters);
      const newUrl = params
        ? `${window.location.pathname}?${params}`
        : window.location.pathname;

      // Используем replaceState чтобы не создавать новую запись в истории для каждого изменения
      window.history.replaceState({}, '', newUrl);

      console.log('🔗 URL обновлен:', newUrl);
    },
    [filtersToUrlParams]
  );

  // Восстанавливаем фильтры из URL при загрузке
  useEffect(() => {
    if (isInitialized) return;

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.toString()) {
      console.log('🔗 Восстанавливаем фильтры из URL:', window.location.search);

      const urlFilters = urlParamsToFilters(searchParams);

      // Применяем фильтры из URL
      onFiltersChange(urlFilters);
    }

    setIsInitialized(true);
  }, [isInitialized, onFiltersChange, urlParamsToFilters]);

  // Синхронизируем URL при изменении фильтров
  const syncUrlWithFilters = useCallback(
    (filters: UrlFilters) => {
      if (!isInitialized) return;

      updateUrl(filters);
    },
    [isInitialized, updateUrl]
  );

  // Функция для сброса URL (удаления всех параметров)
  const resetUrl = useCallback(() => {
    window.history.replaceState({}, '', window.location.pathname);
    console.log('🔗 URL сброшен');
  }, []);

  // Функция для создания shareable URL
  const getShareableUrl = useCallback(
    (filters: UrlFilters) => {
      const params = filtersToUrlParams(filters);
      return `${window.location.origin}${window.location.pathname}${
        params ? `?${params}` : ''
      }`;
    },
    [filtersToUrlParams]
  );

  return {
    syncUrlWithFilters,
    resetUrl,
    getShareableUrl,
    isInitialized,
  };
};

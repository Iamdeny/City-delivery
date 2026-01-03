import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SortOption } from './useProductFilters';
import { logger } from '../utils/logger';

interface UrlFilters {
  search: string;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
}

interface UseUrlFiltersProps {
  initialMinPrice: number;
  initialMaxPrice: number;
  onFiltersChange: (filters: UrlFilters) => void;
}

export const useUrlFilters = ({
  initialMinPrice,
  initialMaxPrice,
  onFiltersChange,
}: UseUrlFiltersProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const onFiltersChangeRef = useRef(onFiltersChange);
  
  // Используем ref для стабильных значений начальных цен
  const initialMinPriceRef = useRef(initialMinPrice);
  const initialMaxPriceRef = useRef(initialMaxPrice);

  // Обновляем ref при изменении callback
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);
  
  // Обновляем ref для начальных цен (но не пересоздаём функции!)
  useEffect(() => {
    initialMinPriceRef.current = initialMinPrice;
    initialMaxPriceRef.current = initialMaxPrice;
  }, [initialMinPrice, initialMaxPrice]);

  // Функция для преобразования фильтров в URL параметры
  // НЕ зависит от initialFilters - использует ref!
  const filtersToUrlParams = useCallback(
    (filters: UrlFilters) => {
      const params = new URLSearchParams();

      if (filters.search) {
        params.set('search', filters.search);
      }

      if (filters.categories.length > 0) {
        params.set('categories', filters.categories.join(','));
      }

      // Используем ref для начальных цен
      if (filters.minPrice > initialMinPriceRef.current) {
        params.set('min_price', filters.minPrice.toString());
      }

      if (filters.maxPrice < initialMaxPriceRef.current) {
        params.set('max_price', filters.maxPrice.toString());
      }

      if (filters.sort !== 'relevance') {
        params.set('sort', filters.sort);
      }

      return params.toString();
    },
    [] // ← Пустой массив! Используем ref!
  );

  // Функция для парсинга URL параметров в фильтры
  // НЕ зависит от initialFilters - использует ref!
  const urlParamsToFilters = useCallback(
    (searchParams: URLSearchParams): UrlFilters => {
      const search = searchParams.get('search') || '';
      const categoriesParam = searchParams.get('categories') || '';
      const categories = categoriesParam
        ? categoriesParam.split(',').filter(Boolean)
        : [];
      const minPrice =
        Number(searchParams.get('min_price')) || initialMinPriceRef.current;
      const maxPrice =
        Number(searchParams.get('max_price')) || initialMaxPriceRef.current;
      const sort = (searchParams.get('sort') as SortOption) || 'relevance';

      return {
        search,
        categories,
        minPrice: Math.max(minPrice, initialMinPriceRef.current),
        maxPrice: Math.min(maxPrice, initialMaxPriceRef.current),
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
    [] // ← Пустой массив! Используем ref!
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

      logger.log('🔗 URL обновлен:', newUrl);
    },
    [filtersToUrlParams]
  );

  // Восстанавливаем фильтры из URL при загрузке
  useEffect(() => {
    if (isInitialized) return;

    const searchParams = new URLSearchParams(window.location.search);

    if (searchParams.toString()) {
      logger.log('🔗 Восстанавливаем фильтры из URL:', window.location.search);

      const urlFilters = urlParamsToFilters(searchParams);

      // Применяем фильтры из URL
      onFiltersChangeRef.current(urlFilters);
    }

    setIsInitialized(true);
  }, [isInitialized, urlParamsToFilters]);

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
    logger.log('🔗 URL сброшен');
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

  // Мемоизируем возвращаемый объект
  return useMemo(() => ({
    syncUrlWithFilters,
    resetUrl,
    getShareableUrl,
    isInitialized,
  }), [syncUrlWithFilters, resetUrl, getShareableUrl, isInitialized]);
};

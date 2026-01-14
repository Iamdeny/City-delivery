import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Product } from '../shared/types';
import { FILTERS } from '../config/constants';

export type SortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  priceRange: [number, number];
  sortOption: SortOption;
}

export interface UseProductFiltersProps {
  products: Product[];
}

export interface UrlFilterState {
  search: string;
  categories: string[];
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
}

export const useProductFilters = ({ products }: UseProductFiltersProps) => {
  // Состояние фильтров
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategories: [],
    priceRange: FILTERS.DEFAULT_PRICE_RANGE,
    sortOption: FILTERS.DEFAULT_SORT,
  });

  // Вычисляем минимальную и максимальную цены
  const { minPrice, maxPrice } = useMemo(() => {
    if (products.length === 0) {
      return {
        minPrice: FILTERS.DEFAULT_PRICE_RANGE[0],
        maxPrice: FILTERS.DEFAULT_PRICE_RANGE[1],
      };
    }

    const prices = products.map((p) => p.price);
    const calculatedMin = Math.min(...prices);
    const calculatedMax = Math.max(...prices);

    return {
      minPrice: calculatedMin,
      maxPrice:
        calculatedMax > calculatedMin ? calculatedMax : calculatedMin + 1000,
    };
  }, [products]);

  // Используем ref для стабильных функций
  const minPriceRef = useRef(minPrice);
  const maxPriceRef = useRef(maxPrice);
  
  useEffect(() => {
    minPriceRef.current = minPrice;
    maxPriceRef.current = maxPrice;
  }, [minPrice, maxPrice]);

  // Получаем все уникальные категории
  const allCategories = useMemo((): string[] => {
    const categories = products
      .map((p) => p.category)
      .filter((category): category is string => {
        return typeof category === 'string' && category.trim() !== '';
      });

    const uniqueCategories = Array.from(new Set(categories));
    return uniqueCategories.sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Мемоизированные сеттеры
  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setSelectedCategories = useCallback((categories: string[]) => {
    setFilters((prev) => ({ ...prev, selectedCategories: categories }));
  }, []);

  const setPriceRange = useCallback((range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }));
  }, []);

  const setSortOption = useCallback((option: SortOption) => {
    setFilters((prev) => ({ ...prev, sortOption: option }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      selectedCategories: [],
      priceRange: [minPriceRef.current, maxPriceRef.current], // используем ref
      sortOption: FILTERS.DEFAULT_SORT,
    });
  }, []); // ← Пустой массив, но использует актуальные значения через ref!

  // Установка фильтров из URL
  const setFiltersFromUrl = useCallback(
    (urlFilters: {
      search?: string;
      categories?: string[];
      priceRange?: [number, number];
      sort?: SortOption;
    }) => {
      setFilters((prev) => ({
        ...prev,
        searchQuery: urlFilters.search || prev.searchQuery,
        selectedCategories: urlFilters.categories || prev.selectedCategories,
        priceRange: urlFilters.priceRange || prev.priceRange,
        sortOption: urlFilters.sort || prev.sortOption,
      }));
    },
    []
  );

  // Фильтрация и сортировка продуктов (оптимизировано)
  const filteredProducts = useMemo(() => {
    // Быстрый выход если нет продуктов
    if (products.length === 0) return [];

    let result = products;

    // Фильтрация по поисковому запросу (только если есть запрос)
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      // Используем Set для быстрой проверки категорий
      const categorySet = new Set(
        result.map((p) => p.category.toLowerCase())
      );
      const hasCategoryMatch = categorySet.has(query);

      result = result.filter((product) => {
        const nameMatch = product.name.toLowerCase().includes(query);
        const categoryMatch = product.category.toLowerCase().includes(query);
        const descMatch =
          product.description?.toLowerCase().includes(query) || false;
        return nameMatch || categoryMatch || descMatch;
      });
    }

    // Фильтрация по категориям (используем Set для O(1) проверки)
    if (filters.selectedCategories.length > 0) {
      const categorySet = new Set(filters.selectedCategories);
      result = result.filter((product) => categorySet.has(product.category));
    }

    // Фильтрация по цене
    const [min, max] = filters.priceRange;
    if (min > 0 || max < Infinity) {
      result = result.filter(
        (product) => product.price >= min && product.price <= max
      );
    }

    // Сортировка (только если нужно)
    if (filters.sortOption !== 'relevance') {
      // Создаем новый массив для сортировки (не мутируем оригинал)
      result = [...result].sort((a, b) => {
        switch (filters.sortOption) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name, 'ru');
          case 'name-desc':
            return b.name.localeCompare(a.name, 'ru');
          default:
            return 0;
        }
      });
    }

    return result;
  }, [
    products,
    filters.searchQuery,
    filters.selectedCategories.join(','),
    filters.priceRange[0],
    filters.priceRange[1],
    filters.sortOption,
  ]);

  // Проверка наличия активных фильтров
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.selectedCategories.length > 0 ||
      filters.priceRange[0] > minPrice ||
      filters.priceRange[1] < maxPrice ||
      filters.sortOption !== 'relevance'
    );
  }, [
    filters.searchQuery,
    filters.selectedCategories.length,
    filters.priceRange[0],
    filters.priceRange[1],
    filters.sortOption,
    minPrice,
    maxPrice,
  ]);

  // Количество активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedCategories.length > 0) count++;
    if (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice)
      count++;
    if (filters.sortOption !== 'relevance') count++;
    return count;
  }, [
    filters.searchQuery,
    filters.selectedCategories.length,
    filters.priceRange[0],
    filters.priceRange[1],
    filters.sortOption,
    minPrice,
    maxPrice,
  ]);

  // Состояние для URL
  const urlFilterState = useMemo((): UrlFilterState => {
    return {
      search: filters.searchQuery,
      categories: filters.selectedCategories,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      sort: filters.sortOption,
    };
  }, [
    filters.searchQuery,
    filters.selectedCategories.join(','),
    filters.priceRange[0],
    filters.priceRange[1],
    filters.sortOption,
  ]);

  // Мемоизируем массивы чтобы ссылки не менялись
  const memoizedSelectedCategories = useMemo(
    () => filters.selectedCategories,
    [filters.selectedCategories.join(',')]
  );
  
  const memoizedPriceRange = useMemo(
    () => filters.priceRange as [number, number],
    [filters.priceRange[0], filters.priceRange[1]]
  );

  // Мемоизируем строковое представление allCategories для стабильности
  const allCategoriesKey = useMemo(
    () => allCategories.join(','),
    [allCategories] // ← Зависимость от массива, но сравниваем по содержимому
  );

  // Мемоизируем возвращаемый объект чтобы избежать бесконечного цикла
  return useMemo(() => ({
    // Текущие значения фильтров
    searchQuery: filters.searchQuery,
    selectedCategories: memoizedSelectedCategories,
    priceRange: memoizedPriceRange,
    sortOption: filters.sortOption,

    // Вычисленные значения
    minPrice,
    maxPrice,
    allCategories, // ← Возвращаем массив
    filteredProducts,

    // Статистика
    hasActiveFilters,
    activeFiltersCount,
    urlFilterState,

    // Сеттеры
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
    resetFilters,
    setFiltersFromUrl,
  }), [
    filters.searchQuery,
    memoizedSelectedCategories,
    memoizedPriceRange,
    filters.sortOption,
    minPrice,
    maxPrice,
    allCategoriesKey,  // ← Используем строковое представление для стабильности!
    filteredProducts.length,  // ← Массив → длина!
    hasActiveFilters,
    activeFiltersCount,
    // urlFilterState не включаем - он вычисляется из тех же полей
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
    resetFilters,
    setFiltersFromUrl,
  ]);
};

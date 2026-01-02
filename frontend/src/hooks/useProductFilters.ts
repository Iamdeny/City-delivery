import { useState, useCallback, useMemo } from 'react';
import { Product } from '../types/product';

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
    priceRange: [0, 1000],
    sortOption: 'relevance',
  });

  // Вычисляем минимальную и максимальную цены
  const { minPrice, maxPrice } = useMemo(() => {
    if (products.length === 0) {
      return { minPrice: 0, maxPrice: 1000 };
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
      priceRange: [minPrice, maxPrice],
      sortOption: 'relevance',
    });
  }, [minPrice, maxPrice]);

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

  // Фильтрация и сортировка продуктов
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Фильтрация по поисковому запросу
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );
    }

    // Фильтрация по категориям
    if (filters.selectedCategories.length > 0) {
      result = result.filter((product) =>
        filters.selectedCategories.includes(product.category)
      );
    }

    // Фильтрация по цене
    const [min, max] = filters.priceRange;
    result = result.filter(
      (product) => product.price >= min && product.price <= max
    );

    // Сортировка
    result.sort((a, b) => {
      switch (filters.sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'relevance':
        default:
          return 0;
      }
    });

    return result;
  }, [products, filters]);

  // Проверка наличия активных фильтров
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.selectedCategories.length > 0 ||
      filters.priceRange[0] > minPrice ||
      filters.priceRange[1] < maxPrice ||
      filters.sortOption !== 'relevance'
    );
  }, [filters, minPrice, maxPrice]);

  // Количество активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedCategories.length > 0) count++;
    if (filters.priceRange[0] > minPrice || filters.priceRange[1] < maxPrice)
      count++;
    if (filters.sortOption !== 'relevance') count++;
    return count;
  }, [filters, minPrice, maxPrice]);

  // Состояние для URL
  const urlFilterState = useMemo((): UrlFilterState => {
    return {
      search: filters.searchQuery,
      categories: filters.selectedCategories,
      minPrice: filters.priceRange[0],
      maxPrice: filters.priceRange[1],
      sort: filters.sortOption,
    };
  }, [filters]);

  return {
    // Текущие значения фильтров
    searchQuery: filters.searchQuery,
    selectedCategories: filters.selectedCategories,
    priceRange: filters.priceRange,
    sortOption: filters.sortOption,

    // Вычисленные значения
    minPrice,
    maxPrice,
    allCategories,
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
  };
};

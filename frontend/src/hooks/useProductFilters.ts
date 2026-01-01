import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types/product';

export type SortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export interface UrlFilterState {
  search: string;
  categories: string[];
  priceRange: [number, number];
  sort: SortOption;
}

interface UseProductFiltersProps {
  products: Product[];
  initialSearch?: string;
  initialCategories?: string[];
  initialSort?: SortOption;
  initialPriceRange?: [number, number];
}

export const useProductFilters = ({
  products,
  initialSearch = '',
  initialCategories = [],
  initialSort = 'relevance',
  initialPriceRange,
}: UseProductFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);

  // Вычисляем минимальную и максимальную цену из всех товаров
  const { minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) {
      return { minPrice: 0, maxPrice: 10000 };
    }

    // Безопасное получение цен
    const prices = products
      .map((p) => (typeof p.price === 'number' ? p.price : 0))
      .filter((price) => !isNaN(price));

    if (prices.length === 0) {
      return { minPrice: 0, maxPrice: 10000 };
    }

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [products]);

  // Инициализируем диапазон цен
  useEffect(() => {
    if (products.length > 0) {
      const prices = products
        .map((p) => (typeof p.price === 'number' ? p.price : 0))
        .filter((price) => !isNaN(price));

      if (prices.length > 0) {
        const newMin = Math.min(...prices);
        const newMax = Math.max(...prices);

        // Если передали начальный диапазон - используем его, иначе вычисляем
        if (initialPriceRange) {
          setPriceRange([
            Math.max(initialPriceRange[0], newMin),
            Math.min(initialPriceRange[1], newMax),
          ]);
        } else {
          setPriceRange([newMin, newMax]);
        }
      }
    }
  }, [products, initialPriceRange]);

  // Получаем все уникальные категории
  const allCategories = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Безопасное извлечение категорий
    const categories = products
      .map((p) => p?.category || '')
      .filter((category) => category && typeof category === 'string')
      .map((category) => category.trim());

    return Array.from(new Set(categories))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Функция фильтрации с безопасным доступом к данным
  const filteredProducts = useMemo(() => {
    console.log('🔍 Начинаем фильтрацию...', {
      всего_товаров: products.length,
      поиск: searchQuery,
      выбранные_категории: selectedCategories,
      диапазон_цены: priceRange,
      сортировка: sortOption,
    });

    let result = [...products];

    // 1. Поиск по названию и категории
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      console.log(`🔎 Ищем: "${query}"`);

      result = result.filter((product) => {
        const name = String(product?.name || '').toLowerCase();
        const category = String(product?.category || '').toLowerCase();

        return name.includes(query) || category.includes(query);
      });

      console.log(`✅ После поиска: ${result.length} товаров`);
    }

    // 2. Фильтрация по категориям
    if (selectedCategories.length > 0) {
      console.log(`🏷️ Фильтруем по категориям:`, selectedCategories);

      result = result.filter((product) => {
        const category = String(product?.category || '').trim();
        return selectedCategories.includes(category);
      });

      console.log(`✅ После категорий: ${result.length} товаров`);
    }

    // 3. Фильтрация по цене
    console.log(
      `💰 Фильтруем по цене: от ${priceRange[0]} до ${priceRange[1]}`
    );

    result = result.filter((product) => {
      const price = Number(product?.price) || 0;
      const isValidPrice = !isNaN(price);
      return isValidPrice && price >= priceRange[0] && price <= priceRange[1];
    });

    console.log(`✅ После цены: ${result.length} товаров`);

    // 4. Сортировка
    console.log(`📊 Сортируем по: ${sortOption}`);

    result.sort((a, b) => {
      // Безопасные значения для сортировки
      const aPrice = Number(a?.price) || 0;
      const bPrice = Number(b?.price) || 0;
      const aName = String(a?.name || '');
      const bName = String(b?.name || '');

      switch (sortOption) {
        case 'price-asc':
          return aPrice - bPrice;

        case 'price-desc':
          return bPrice - aPrice;

        case 'name-asc':
          return aName.localeCompare(bName);

        case 'name-desc':
          return bName.localeCompare(aName) * -1;

        case 'relevance':
        default:
          // Релевантность: сначала товары, соответствующие поиску
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const aMatch =
              String(a?.name || '')
                .toLowerCase()
                .includes(query) ||
              String(a?.category || '')
                .toLowerCase()
                .includes(query);
            const bMatch =
              String(b?.name || '')
                .toLowerCase()
                .includes(query) ||
              String(b?.category || '')
                .toLowerCase()
                .includes(query);

            if (aMatch && !bMatch) return -1;
            if (!aMatch && bMatch) return 1;
          }
          return 0;
      }
    });

    console.log(`🎉 Финальный результат: ${result.length} товаров`);

    // Логируем первые 3 товара для проверки
    if (result.length > 0) {
      console.log(
        '📦 Примеры товаров:',
        result.slice(0, 3).map((p) => ({
          name: p.name,
          category: p.category,
          price: p.price,
          inStock: p.inStock,
        }))
      );
    }

    return result;
  }, [products, searchQuery, selectedCategories, priceRange, sortOption]);

  // Сброс всех фильтров
  const resetFilters = () => {
    console.log('🔄 Сбрасываем все фильтры');
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([minPrice, maxPrice]);
    setSortOption('relevance');
  };

  // Установка фильтров из URL
  const setFiltersFromUrl = (urlFilters: Partial<UrlFilterState>) => {
    console.log('🔗 Устанавливаем фильтры из URL:', urlFilters);

    if (urlFilters.search !== undefined) {
      setSearchQuery(urlFilters.search);
    }

    if (urlFilters.categories !== undefined) {
      setSelectedCategories(urlFilters.categories);
    }

    if (urlFilters.priceRange !== undefined) {
      setPriceRange(urlFilters.priceRange);
    }

    if (urlFilters.sort !== undefined) {
      setSortOption(urlFilters.sort);
    }
  };

  // Получение текущего состояния фильтров для URL
  const getUrlFilterState = (): UrlFilterState => {
    return {
      search: searchQuery,
      categories: selectedCategories,
      priceRange,
      sort: sortOption,
    };
  };

  // Логируем изменения фильтров
  useEffect(() => {
    console.log('🔄 Фильтры обновлены:', {
      searchQuery,
      selectedCategories,
      priceRange,
      sortOption,
      minPrice,
      maxPrice,
      allCategories: allCategories.length,
      filteredProducts: filteredProducts.length,
    });
  }, [
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories.length,
    filteredProducts.length,
  ]);

  return {
    // Состояния
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories,
    filteredProducts,

    // Текущее состояние для URL
    urlFilterState: getUrlFilterState(),

    // Сеттеры
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,

    // Действия
    resetFilters,
    setFiltersFromUrl,

    // Дополнительные утилиты
    hasActiveFilters:
      searchQuery.trim() !== '' ||
      selectedCategories.length > 0 ||
      priceRange[0] !== minPrice ||
      priceRange[1] !== maxPrice ||
      sortOption !== 'relevance',

    activeFiltersCount:
      (searchQuery.trim() !== '' ? 1 : 0) +
      (selectedCategories.length > 0 ? 1 : 0) +
      (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0) +
      (sortOption !== 'relevance' ? 1 : 0),
  };
};

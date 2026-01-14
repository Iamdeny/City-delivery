/**
 * Page: Catalog
 * Страница каталога товаров с новой архитектурой
 */

import React, { useState, useMemo } from 'react';
import { ProductCatalog } from '../../widgets/product-catalog/ui/ProductCatalog';
import type { ProductFilters } from '../../entities/product/model/types';
import './CatalogPage.css';

export function CatalogPage() {
  const [filters, setFilters] = useState<ProductFilters>({
    searchQuery: '',
    categories: [],
    priceRange: [0, 10000],
    sortBy: 'relevance',
  });

  const handleSearchChange = (query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setFilters((prev) => ({ ...prev, priceRange: range }));
  };

  const handleSortChange = (sortBy: ProductFilters['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  return (
    <div className="catalog-page">
      <div className="catalog-page-header">
        <h1>Каталог товаров</h1>
        {/* Здесь можно добавить фильтры и поиск */}
      </div>
      
      <ProductCatalog filters={filters} />
    </div>
  );
}

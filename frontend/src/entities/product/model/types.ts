/**
 * Product Entity - Типы
 */

import type { Product as ProductSchema } from './schema';

export type Product = ProductSchema;

export interface ProductFilters {
  searchQuery: string;
  categories: string[];
  priceRange: [number, number];
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'name';
}

export interface ProductCategory {
  name: string;
  count: number;
  image?: string;
}

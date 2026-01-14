/**
 * Entity: Product API
 * React Query hook для загрузки товаров
 */

import { useQuery } from '@tanstack/react-query';
import { productService } from '../../../services/product.service';
import { validateProductsResponse } from '../model/schema';
import type { Product } from '../model/types';

interface UseProductsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const data = await productService.fetchProducts();
      // Валидация через Zod
      return validateProductsResponse(data);
    },
    enabled,
    refetchInterval,
    staleTime: 30000, // 30 секунд
    refetchOnWindowFocus: false,
  });
}

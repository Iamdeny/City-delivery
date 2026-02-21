/**
 * Рекомендации для корзины (Советуем)
 * Вызов идёт через Next.js API route /api/products/recommendations (прокси на бэкенд)
 */
'use client';

import type { Product } from '@/types';

export async function fetchRecommendations(
  excludeIds: number[],
  limit: number = 6
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (excludeIds.length > 0) {
      params.set('exclude', excludeIds.join(','));
    }
    params.set('limit', String(limit));

    const res = await fetch(
      `/api/products/recommendations?${params.toString()}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!res.ok) {
      // В dev можно залогировать
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Recommendations API returned ${res.status}`);
      }
      return [];
    }

    const data = await res.json();

    // Бэкенд возвращает { success: true, products: [...] }
    // или напрямую массив (на всякий случай)
    const products = data?.products ?? data;
    if (!Array.isArray(products)) return [];

    return products.map((p: Record<string, unknown>) => ({
      id: Number(p.id),
      name: String(p.name ?? ''),
      price: Number(p.price ?? 0),
      category: String(p.category ?? ''),
      image: p.image != null ? String(p.image) : undefined,
      inStock: p.in_stock !== false,
      description: p.description != null ? String(p.description) : undefined,
    })) as Product[];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching recommendations:', error);
    }
    return [];
  }
}

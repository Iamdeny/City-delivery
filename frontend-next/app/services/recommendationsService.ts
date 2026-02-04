/**
 * Рекомендации для корзины (Советуем)
 * Вызов идёт через Next.js API route /api/products/recommendations (прокси на бэкенд, без CORS)
 */
'use client';

import type { Product } from '@/types';

export async function fetchRecommendations(excludeIds: number[], limit: number = 6): Promise<Product[]> {
  try {
    const exclude = excludeIds.length > 0 ? excludeIds.join(',') : '';
    const params = new URLSearchParams();
    if (exclude) params.set('exclude', exclude);
    params.set('limit', String(limit));

    const res = await fetch(`/api/products/recommendations?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const list = data?.products ?? data;
    if (!Array.isArray(list)) return [];

    return list.map((p: Record<string, unknown>) => ({
      id: Number(p.id),
      name: String(p.name ?? ''),
      price: Number(p.price ?? 0),
      category: String(p.category ?? ''),
      image: p.image != null ? String(p.image) : undefined,
      inStock: p.in_stock !== false,
      description: p.description != null ? String(p.description) : undefined,
    })) as Product[];
  } catch {
    return [];
  }
}

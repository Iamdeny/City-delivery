/**
 * Страница категорий (Server Component)
 * Подтягивает реальные категории из продуктов
 */

import type { Metadata } from 'next';
import { getProducts } from '@/lib/api/products';
import { CategoriesPage } from '@/app/components/categories/CategoriesPage';

export const metadata: Metadata = {
  title: 'Категории - City Delivery',
  description: 'Выберите категорию продуктов и начните покупки.',
};

export default async function CategoriesRoute() {
  const products = await getProducts();

  const counts = new Map<string, number>();
  for (const p of products) {
    const category = (p.category ?? '').trim();
    if (!category) continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  const categories = Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'));

  const featuredProducts = products.slice(0, 10);

  return <CategoriesPage categories={categories} featuredProducts={featuredProducts} />;
}

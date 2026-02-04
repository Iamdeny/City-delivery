/**
 * Главная страница - Server Component в стиле Самоката
 * Использует server-side data fetching для SEO и производительности
 */
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts } from '@/lib/api/products';
import { POPULAR_CATEGORIES } from '@/lib/categoryIcons';
import HomeClient from '@/app/components/home/HomeClient';

// SEO метаданные
export const metadata: Metadata = {
  title: 'City Delivery - Доставка продуктов за 15 минут',
  description: 'Свежие продукты, быстрая доставка, удобный заказ. Все что нужно для комфортной жизни.',
  openGraph: {
    title: 'City Delivery - Доставка продуктов',
    description: 'Быстрая доставка продуктов за 15 минут',
    type: 'website',
  },
};

// Server Component - выполняется на сервере
export default async function Home() {
  // Server-side data fetching с ISR кэшированием
  const products = await getProducts();
  
  // Вычисляем категории на сервере с подсчетом товаров
  const categoryCounts = new Map<string, number>();
  products.forEach(p => {
    const cat = p.category || 'Другие';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });
  
  // Формируем категории с иконками и ссылками
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => ({
      name,
      link: `/products?category=${encodeURIComponent(name)}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // Если категорий мало, добавляем популярные
  if (categories.length < 6) {
    POPULAR_CATEGORIES.forEach(cat => {
      if (!categories.find(c => c.name === cat.name)) {
        categories.push({
          name: cat.name,
          link: `/products?category=${encodeURIComponent(cat.name)}`,
          count: 0,
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Suspense fallback={
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            <div className="hidden lg:block w-64">
              <div className="bg-white rounded-lg p-4 space-y-2 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded" />
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-7 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="bg-gray-100 rounded-lg aspect-square animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }>
        <HomeClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}

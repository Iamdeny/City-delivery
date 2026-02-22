/**
 * Layout для страницы корзины
 * Добавляет метаданные для SEO
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Корзина - City Delivery',
  description: 'Просмотрите товары в корзине и оформите заказ. Быстрая доставка за 15 минут.',
  robots: 'noindex, nofollow', // Корзина не должна индексироваться
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

/**
 * Layout для страницы заказа
 * Добавляет метаданные для SEO
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Оформление заказа - City Delivery',
  description: 'Оформите заказ с быстрой доставкой. Укажите адрес и время доставки.',
  robots: 'noindex, nofollow', // Страница заказа не должна индексироваться
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

/**
 * Layout для страницы входа
 * Добавляет метаданные для SEO
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вход в систему - City Delivery',
  description: 'Войдите в систему для оформления заказов и отслеживания доставки.',
  robots: 'noindex, nofollow', // Страница входа не должна индексироваться
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

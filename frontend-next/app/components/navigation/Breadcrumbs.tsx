'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DEFAULT_LABELS: Record<string, string> = {
  products: 'Каталог',
  cart: 'Корзина',
  categories: 'Категории',
  login: 'Вход',
  order: 'Оформление заказа',
  profile: 'Профиль',
  orders: 'Мои заказы',
};

function humanizeSegment(segment: string) {
  const decoded = decodeURIComponent(segment);
  const spaced = decoded.replace(/[-_]+/g, ' ').trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : decoded;
}

export interface BreadcrumbsProps {
  className?: string;
  labels?: Record<string, string>;
  showHome?: boolean;
}

export default function Breadcrumbs({
  // По умолчанию показываем только на десктопе (в стиле Самоката)
  className = 'hidden lg:block',
  labels,
  showHome = true,
}: BreadcrumbsProps) {
  const pathname = usePathname();

  if (!pathname || pathname === '/') return null;

  const mergedLabels = { ...DEFAULT_LABELS, ...(labels ?? {}) };
  const segments = pathname.split('/').filter(Boolean);

  // Пример: /products/sale -> [{href:'/products', label:'Каталог'}, {href:'/products/sale', label:'Sale'}]
  const crumbs = segments.map((segment, idx) => {
    const href = `/${segments.slice(0, idx + 1).join('/')}`;
    const label = mergedLabels[segment] ?? humanizeSegment(segment);
    return { href, label };
  });

  return (
    <nav
      aria-label="Хлебные крошки"
      className={`w-full ${className}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
        {showHome && (
          <li className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-gray-900 transition-colors"
            >
              Главная
            </Link>
            <span className="text-gray-300">›</span>
          </li>
        )}

        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-2">
              {isLast ? (
                <span
                  className="text-gray-900 font-medium"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
              {!isLast && <span className="text-gray-300">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


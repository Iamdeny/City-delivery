'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function itemClass(active: boolean) {
  return active
    ? 'bg-gray-900 text-white'
    : 'text-gray-900 hover:bg-gray-100';
}

export function OpsSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:shrink-0 border-r border-gray-200 bg-white">
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="text-xs font-semibold text-gray-500">City Delivery</div>
        <div className="text-lg font-extrabold text-gray-900">Ops</div>
      </div>

      <nav className="p-3 space-y-1">
        <Link
          href="/ops/orders"
          className={`block rounded-xl px-3 py-2 text-sm font-extrabold ${itemClass(isActive('/ops/orders'))}`}
        >
          Заказы · Живая очередь
        </Link>
        <Link
          href="/ops/warehouses"
          className={`block rounded-xl px-3 py-2 text-sm font-extrabold ${itemClass(isActive('/ops/warehouses'))}`}
        >
          Склады
        </Link>
        <Link
          href="/ops/users"
          className={`block rounded-xl px-3 py-2 text-sm font-extrabold ${itemClass(isActive('/ops/users'))}`}
        >
          Пользователи
        </Link>
        <Link
          href="/ops/audit"
          className={`block rounded-xl px-3 py-2 text-sm font-extrabold ${itemClass(isActive('/ops/audit'))}`}
        >
          Аудит
        </Link>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-200 text-xs text-gray-500">
        Wolt‑style shell: sidebar + header
      </div>
    </aside>
  );
}


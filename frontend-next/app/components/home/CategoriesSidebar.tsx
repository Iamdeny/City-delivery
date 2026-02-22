/**
 * Боковое меню категорий в стиле Самоката
 * Показывается слева на десктопе
 */
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { getCategoryIcon } from '@/lib/categoryIcons';

interface Category {
  name: string;
  link: string;
  count?: number;
}

interface CategoriesSidebarProps {
  categories: Category[];
}

export default function CategoriesSidebar({ categories }: CategoriesSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get('category');

  return (
    <aside className="hidden lg:block w-[264px] flex-shrink-0">
      <nav className="sticky top-[calc(var(--safe-top)+64px)] bg-[#f2f2f2] rounded-lg p-3 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide" aria-label="Категории">
        <ul className="space-y-0.5">
          {categories.map((category) => {
            const isActive = currentCategory === category.name || (pathname === '/' && !currentCategory && category.name === categories[0]?.name);
            const icon = getCategoryIcon(category.name);
            
            return (
              <li key={category.name}>
                <Link
                  href={category.link}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-[#1a1a1a] hover:bg-white/50'
                  }`}
                >
                  <span className="text-lg leading-none flex-shrink-0">{icon}</span>
                  <span className="flex-1 min-w-0 truncate">{category.name}</span>
                  {category.count !== undefined && category.count > 0 && (
                    <span className={`text-xs flex-shrink-0 ${isActive ? 'text-white/70' : 'text-[#404040]'}`}>
                      {category.count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

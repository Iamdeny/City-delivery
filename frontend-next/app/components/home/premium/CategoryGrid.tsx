/**
 * CategoryGrid — Premium 2026
 * Горизонтальный скролл категорий под хедером.
 * Активный таб: нижняя полоска 2px или заливка темным цветом (Instacart Green).
 */
'use client';

import { usePathname, useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  href?: string;
}

interface CategoryGridProps {
  categories: Category[];
  activeId?: string;
  className?: string;
}

export default function CategoryGrid({ categories, activeId, className = '' }: CategoryGridProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={`flex gap-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory border-b border-gray-100 bg-white ${className}`}
      style={{ paddingLeft: 'var(--premium-margin-mobile)', paddingRight: 'var(--premium-margin-mobile)' }}
      role="tablist"
      aria-label="Категории"
    >
      {categories.map((cat) => {
        const isActive = activeId === cat.id || (cat.href && pathname.startsWith(cat.href));
        return (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => cat.href && router.push(cat.href)}
            className="flex-shrink-0 snap-start px-4 py-3 text-[14px] font-medium transition-colors relative"
            style={{
              color: isActive ? 'var(--premium-accent)' : 'var(--premium-text-secondary)',
            }}
          >
            {cat.name}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--premium-accent)] rounded-full"
                style={{ height: 2 }}
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

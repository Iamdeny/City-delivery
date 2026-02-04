/**
 * SearchBar — Premium 2026
 * Высота 48px, фон #F6F6F6, иконка поиска слева, скругление 24px.
 */
'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';

interface SearchBarProps {
  placeholder?: string;
  href?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Найти молоко, хлеб, сыр…',
  href = '/products',
  className = '',
}: SearchBarProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 w-full rounded-[var(--premium-radius-search)] bg-[var(--premium-search-bg)] text-left transition-colors active:opacity-90 ${className}`}
      style={{
        height: 'var(--premium-search-height)',
        paddingLeft: 16,
        paddingRight: 16,
      }}
      aria-label="Поиск товаров"
    >
      <Search className="w-5 h-5 text-[var(--premium-text-secondary)] flex-shrink-0" />
      <span className="text-[15px] text-[var(--premium-text-secondary)] truncate">
        {placeholder}
      </span>
    </Link>
  );
}

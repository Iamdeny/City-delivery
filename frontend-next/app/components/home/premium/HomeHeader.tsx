/**
 * HomeHeader — Premium 2026
 * Sticky header с прогрессивным размытием (blur 10px).
 * Слева: адрес доставки, справа: аватар профиля.
 */
'use client';

import Link from 'next/link';
import { MapPin, ChevronDown, User } from 'lucide-react';

const PREMIUM_MARGIN = '16px'; // 1rem

export default function HomeHeader() {
  const address = 'Дом, Пискарёвский проспект';

  return (
    <header
      className="sticky top-0 left-0 right-0 z-[1000] pt-[var(--safe-top)] bg-white/80 backdrop-blur-[10px] border-b border-white/20"
      style={{ paddingLeft: PREMIUM_MARGIN, paddingRight: PREMIUM_MARGIN, paddingBottom: 12 }}
    >
      <div className="flex items-center justify-between gap-3 min-h-[52px]">
        {/* Адрес доставки — слева */}
        <Link
          href="/products"
          className="flex-1 min-w-0 flex items-center gap-2 py-2 text-left active:opacity-80 transition-opacity"
          aria-label="Изменить адрес доставки"
        >
          <MapPin className="w-4 h-4 text-[var(--premium-accent)] flex-shrink-0" />
          <span className="text-[15px] font-semibold text-[var(--premium-text)] truncate">
            {address}
          </span>
          <ChevronDown className="w-4 h-4 text-[var(--premium-text-secondary)] flex-shrink-0" />
        </Link>

        {/* Аватар профиля — справа */}
        <Link
          href="/profile"
          className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--premium-bg-soft)] flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
          aria-label="Профиль"
        >
          <User className="w-5 h-5 text-[var(--premium-text-secondary)]" />
        </Link>
      </div>
    </header>
  );
}

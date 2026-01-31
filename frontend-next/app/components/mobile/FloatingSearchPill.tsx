'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface FloatingSearchPillProps {
  className?: string;
}

/**
 * Samokat-like floating "Поиск" pill (bottom-left).
 * Opens/focuses the header search (via global event).
 */
export default function FloatingSearchPill({ className = '' }: FloatingSearchPillProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const openSearch = useCallback(() => {
    if (!isClient) return;
    window.dispatchEvent(new CustomEvent('cd:open-search'));
  }, [isClient]);

  return (
    <button
      type="button"
      onClick={openSearch}
      className={`fixed z-[998] lg:hidden
                  bottom-4 translate-y-[calc(-1*var(--safe-bottom))]
                  left-4
                  h-12 px-4
                  rounded-full
                  bg-black/70 text-white backdrop-blur-md
                  ring-1 ring-white/10
                  shadow-[0_10px_24px_rgba(0,0,0,0.22)]
                  transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none active:scale-[0.99]
                  inline-flex items-center gap-2.5 ${className}`}
      aria-label="Открыть поиск"
    >
      <Search className="w-5 h-5" />
      <span className="text-sm font-semibold leading-none">Поиск</span>
    </button>
  );
}


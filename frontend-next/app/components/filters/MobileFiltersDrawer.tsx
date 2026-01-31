'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import FiltersSidebar from './FiltersSidebar';
import type { SortOption } from '@/app/hooks/useProductFilters';

interface MobileFiltersDrawerProps {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onResetFilters: () => void;
  productsCount: number;
  filteredProductsCount: number;
  activeFiltersCount?: number;
}

export default function MobileFiltersDrawer(props: MobileFiltersDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Рендерим оверлей через портал в body, иначе `backdrop-filter`/`transform`
  // на родителях может "сломать" fixed-позиционирование (drawer выглядит как inline-блок).
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm text-[13px] font-semibold text-gray-800 active:scale-[0.98]"
        aria-label="Открыть фильтры"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Фильтры
        {typeof props.activeFiltersCount === 'number' && props.activeFiltersCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-purple-600 text-white text-xs font-bold">
            {props.activeFiltersCount}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="fixed inset-0 z-[1200] bg-black/50 flex items-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              >
                <motion.div
                  className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 relative">
                    <div className="w-10 h-1.5 rounded-full bg-gray-200 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                    <span className="text-base font-bold text-gray-900">Фильтры</span>
                    <button
                      type="button"
                      onClick={close}
                      className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-gray-100"
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto pb-[max(16px,var(--safe-bottom))]">
                    <FiltersSidebar {...props} variant="drawer" />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}


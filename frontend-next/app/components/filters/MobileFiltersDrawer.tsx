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
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-800 active:scale-[0.98]"
        aria-label="Открыть фильтры"
      >
        <SlidersHorizontal className="w-5 h-5" />
        {typeof props.activeFiltersCount === 'number' && props.activeFiltersCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {props.activeFiltersCount}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="fixed inset-0 z-[1200] bg-black/50 flex items-end backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={close}
              >
                <motion.div
                  className="w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ 
                    type: 'spring', 
                    damping: 30, 
                    stiffness: 300,
                    mass: 0.8
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 relative flex-shrink-0">
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

                  <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(16px,var(--safe-bottom))]">
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


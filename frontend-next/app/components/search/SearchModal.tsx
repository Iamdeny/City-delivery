'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, X } from 'lucide-react';

export interface SearchModalProps {
  isOpen: boolean;
  initialValue: string;
  onSubmit: (q: string) => void;
  onClose: () => void;
}

/**
 * Mobile search modal (Samokat-like): user types in a dedicated overlay,
 * and we apply the search only on submit (Enter / button).
 * "Отмена" closes without changing the current search.
 */
export default function SearchModal({ isOpen, initialValue, onSubmit, onClose }: SearchModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(initialValue);

  // Keep draft in sync when opening
  useEffect(() => {
    if (!isOpen) return;
    setDraft(initialValue);
  }, [isOpen, initialValue]);

  const submit = useCallback(() => {
    onSubmit(draft.trim());
    onClose();
  }, [draft, onClose, onSubmit]);

  const canClear = useMemo(() => draft.length > 0, [draft]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Focus on open
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[1200] bg-white"
          aria-modal="true"
          role="dialog"
          aria-label="Поиск"
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        >
          <div className="px-4 pt-[max(12px,var(--safe-top))] pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                  placeholder="Поиск товаров..."
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
                  aria-label="Поиск товаров"
                />
                {canClear && (
                  <button
                    type="button"
                    onClick={() => setDraft('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                    aria-label="Очистить поиск"
                  >
                    <X className="w-[18px] h-[18px]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                className="shrink-0 text-[15px] font-semibold text-gray-900 px-2 py-2"
                onClick={onClose}
              >
                Отмена
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-3 rounded-2xl bg-gray-900 text-white font-semibold active:scale-[0.99]"
                onClick={submit}
              >
                Найти
              </button>
              <button
                type="button"
                className="py-3 px-4 rounded-2xl bg-gray-100 text-gray-900 font-semibold active:scale-[0.99]"
                onClick={() => {
                  setDraft('');
                  onSubmit('');
                  onClose();
                }}
              >
                Сброс
              </button>
            </div>
          </div>

          <div className="p-4 text-sm text-gray-500">
            Введите запрос и нажмите «Найти».
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


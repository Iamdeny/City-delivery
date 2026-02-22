'use client';

import { useEffect, useRef } from 'react';

type Props = {
  itemSelector: string;
  selectedClassName?: string;
  initialIndex?: number;
};

function isEditableTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
}

function hasOpenDialog() {
  return Boolean(document.querySelector('[role="dialog"][data-state="open"], [data-state="open"][role="dialog"]'));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function OpsSelectableListHotkeysClient({
  itemSelector,
  selectedClassName = 'bg-gray-50 ring-1 ring-gray-900/10',
  initialIndex = 0,
}: Props) {
  const idxRef = useRef<number>(initialIndex);

  useEffect(() => {
    const items = () => Array.from(document.querySelectorAll<HTMLElement>(itemSelector));

    const apply = (nextIdx: number) => {
      const list = items();
      if (!list.length) return;
      const safe = clamp(nextIdx, 0, list.length - 1);
      idxRef.current = safe;

      for (let i = 0; i < list.length; i++) {
        const el = list[i];
        const isSel = i === safe;
        el.dataset.opsSelected = isSel ? 'true' : 'false';
        el.classList.toggle(selectedClassName, isSel);
      }

      list[safe]?.scrollIntoView({ block: 'nearest' });
    };

    apply(initialIndex);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (hasOpenDialog()) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        apply(idxRef.current + 1);
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        apply(idxRef.current - 1);
        return;
      }
      if (e.key === 'Enter') {
        const list = items();
        const el = list[idxRef.current];
        if (!el) return;
        e.preventDefault();
        el.click();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [initialIndex, itemSelector, selectedClassName]);

  return null;
}


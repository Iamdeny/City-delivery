'use client';

import { useEffect, useRef } from 'react';

type Props = {
  rowSelector: string;
  actionsSelector: string;
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

export function OpsTableHotkeysClient({ rowSelector, actionsSelector, initialIndex = 0 }: Props) {
  const idxRef = useRef<number>(initialIndex);

  useEffect(() => {
    const selectedClass = ['bg-gray-50', 'ring-1', 'ring-gray-900/10'];

    const rows = () => Array.from(document.querySelectorAll<HTMLElement>(rowSelector));

    const apply = (nextIdx: number) => {
      const list = rows();
      if (!list.length) return;
      const safe = clamp(nextIdx, 0, list.length - 1);
      idxRef.current = safe;

      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        const isSel = i === safe;
        r.dataset.opsRowSelected = isSel ? 'true' : 'false';
        for (const cls of selectedClass) {
          if (isSel) r.classList.add(cls);
          else r.classList.remove(cls);
        }
      }

      const el = list[safe];
      el.scrollIntoView({ block: 'nearest' });
    };

    // initial selection
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
        const list = rows();
        const r = list[idxRef.current];
        if (!r) return;
        const btn = r.querySelector<HTMLElement>(actionsSelector);
        if (!btn) return;
        e.preventDefault();
        btn.click();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actionsSelector, initialIndex, rowSelector]);

  return null;
}


'use client';

import { useEffect } from 'react';

function isEditableTarget(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el.isContentEditable) return true;
  return false;
}

function hasOpenDialog() {
  // Radix Dialog sets role="dialog" and data-state="open" on content
  return Boolean(document.querySelector('[role="dialog"][data-state="open"], [data-state="open"][role="dialog"]'));
}

export function OpsHotkeysClient() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (hasOpenDialog()) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === '/') {
        const target = document.querySelector<HTMLElement>('[data-ops-hotkey="search"]');
        if (!target) return;
        e.preventDefault();
        target.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}


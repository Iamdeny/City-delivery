/**
 * Keeps CSS vars in sync with the *visual* viewport.
 * - Fixes 100vh issues on mobile browsers (address bar, keyboard)
 * - Provides stable sizing for fullscreen/PWA shells
 */
'use client';

import { useEffect } from 'react';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ViewportVars() {
  useEffect(() => {
    let raf = 0;

    const apply = () => {
      const vv = window.visualViewport ?? null;
      const height = vv?.height ?? window.innerHeight;
      const width = vv?.width ?? window.innerWidth;
      const offsetTop = vv?.offsetTop ?? 0;
      const offsetLeft = vv?.offsetLeft ?? 0;

      // Approx keyboard height (mostly useful on Android).
      const keyboard = clamp(window.innerHeight - height - offsetTop, 0, 9999);

      const root = document.documentElement;
      root.style.setProperty('--app-height', `${Math.round(height)}px`);
      root.style.setProperty('--app-width', `${Math.round(width)}px`);
      root.style.setProperty('--vv-offset-top', `${Math.round(offsetTop)}px`);
      root.style.setProperty('--vv-offset-left', `${Math.round(offsetLeft)}px`);
      root.style.setProperty('--keyboard-height', `${Math.round(keyboard)}px`);
    };

    const schedule = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };

    schedule();

    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });

    const vv = window.visualViewport ?? null;
    vv?.addEventListener('resize', schedule, { passive: true });
    vv?.addEventListener('scroll', schedule, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      vv?.removeEventListener('resize', schedule);
      vv?.removeEventListener('scroll', schedule);
    };
  }, []);

  return null;
}


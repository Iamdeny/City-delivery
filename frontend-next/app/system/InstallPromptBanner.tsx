/**
 * PWA install prompt banner:
 * - Android/Chrome: uses beforeinstallprompt
 * - iOS Safari: shows "Add to Home Screen" hint
 * Hides automatically in standalone mode.
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  const m = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
  return Boolean(m || nav.standalone);
}

function isIos() {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isWebkit = /applewebkit/i.test(ua);
  const isChrome = /crios|chrome/i.test(ua);
  const isFirefox = /fxios|firefox/i.test(ua);
  return isWebkit && !isChrome && !isFirefox;
}

const DISMISS_KEY = 'cd_install_banner_dismissed_v1';

export interface InstallPromptBannerProps {
  disabled?: boolean;
}

export function InstallPromptBanner({ disabled = false }: InstallPromptBannerProps) {
  const [visible, setVisible] = useState(false);
  const [modeStandalone, setModeStandalone] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);

  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const showAllowed = useMemo(() => {
    if (disabled) return false;
    if (modeStandalone) return false;
    try {
      return localStorage.getItem(DISMISS_KEY) !== '1';
    } catch {
      return true;
    }
  }, [disabled, modeStandalone]);

  useEffect(() => {
    setModeStandalone(isStandalone());

    const mm = window.matchMedia?.('(display-mode: standalone)');
    const onChange = () => setModeStandalone(isStandalone());
    mm?.addEventListener?.('change', onChange);
    window.addEventListener('appinstalled', onChange, { passive: true });
    return () => {
      mm?.removeEventListener?.('change', onChange);
      window.removeEventListener('appinstalled', onChange);
    };
  }, []);

  // Expose state for future UX tweaks.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.displayMode = modeStandalone ? 'standalone' : 'browser';
  }, [modeStandalone]);

  useEffect(() => {
    if (!showAllowed) {
      setVisible(false);
      return;
    }

    // Android/Chrome install prompt event
    const onBip = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip as EventListener);

    // iOS fallback hint (no beforeinstallprompt)
    if (isIos() && isSafari()) {
      setCanPrompt(false);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip as EventListener);
  }, [showAllowed]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
  }, []);

  const doInstall = useCallback(async () => {
    const ev = promptRef.current;
    if (!ev) return;
    try {
      await ev.prompt();
      const res = await ev.userChoice;
      if (res.outcome === 'accepted') {
        dismiss();
      } else {
        // keep hidden for now
        dismiss();
      }
    } catch {
      dismiss();
    }
  }, [dismiss]);

  if (!visible || modeStandalone) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9997] px-3 pb-[calc(12px+var(--inset-bottom))]">
      <div className="mx-auto max-w-[720px] rounded-2xl bg-white border border-gray-200 shadow-[0_12px_30px_rgba(0,0,0,0.18)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-gray-900">Установить приложение</div>
          {canPrompt ? (
            <div className="text-xs text-gray-600 truncate">Быстрый доступ с экрана телефона и без адресной строки.</div>
          ) : (
            <div className="text-xs text-gray-600 truncate">
              iPhone: нажмите «Поделиться» → «На экран Домой».
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canPrompt ? (
            <button
              type="button"
              className="h-10 px-4 rounded-full bg-gray-900 text-white text-sm font-extrabold active:scale-[0.99]"
              onClick={() => void doInstall()}
            >
              Установить
            </button>
          ) : null}
          <button
            type="button"
            className="h-10 px-3 rounded-full bg-gray-100 text-gray-900 text-sm font-extrabold hover:bg-gray-200 active:scale-[0.99]"
            onClick={dismiss}
            aria-label="Скрыть"
            title="Скрыть"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}


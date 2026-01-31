/**
 * Small "update available" banner for PWA-like UX.
 */
'use client';

export interface UpdateAvailableBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

export function UpdateAvailableBanner({ onReload, onDismiss }: UpdateAvailableBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[9998] px-3 pb-[calc(12px+var(--inset-bottom))]">
      <div className="mx-auto max-w-[720px] rounded-2xl bg-gray-900 text-white shadow-[0_12px_30px_rgba(0,0,0,0.35)] px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold">Доступно обновление</div>
          <div className="text-xs text-white/80 truncate">Обновите приложение, чтобы получить последнюю версию.</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            className="h-10 px-4 rounded-full bg-white text-gray-900 text-sm font-extrabold active:scale-[0.99]"
            onClick={onReload}
          >
            Обновить
          </button>
          <button
            type="button"
            className="h-10 px-3 rounded-full bg-white/10 text-white text-sm font-extrabold hover:bg-white/15 active:scale-[0.99]"
            onClick={onDismiss}
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


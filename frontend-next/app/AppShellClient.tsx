'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartProvider } from './contexts/CartContext';
import { UpdateAvailableBanner } from './system/UpdateAvailableBanner';
import { InstallPromptBanner } from './system/InstallPromptBanner';

// Header остается статическим, так как он критичен для consumer UX
import HeaderPremium from './components/header/HeaderPremium';
import MobileBottomNav from './components/mobile/MobileBottomNav';

// Динамические импорты для consumer shell (не должны тянуться в ops)
const Footer = dynamic(() => import('./components/footer/Footer'), { ssr: true });
const NotificationContainer = dynamic(() => import('./components/notification/NotificationContainer'));

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isOps = pathname === '/ops' || pathname.startsWith('/ops/');
  const canRegisterSw = useMemo(() => !isOps && process.env.NODE_ENV === 'production', [isOps]);

  const [updateReady, setUpdateReady] = useState(false);
  const waitingRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    // Register SW only for consumer app shell and only in production.
    if (typeof window === 'undefined') return;
    if (!canRegisterSw) return;
    if (!('serviceWorker' in navigator)) return;

    let didReload = false;
    const onControllerChange = () => {
      if (didReload) return;
      didReload = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // If there's already a waiting worker, show update.
        if (reg.waiting) {
          waitingRef.current = reg.waiting;
          setUpdateReady(true);
        }

        reg.addEventListener('updatefound', () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') {
              // If we already have a controller, this is an update (not first install)
              if (navigator.serviceWorker.controller) {
                waitingRef.current = reg.waiting;
                setUpdateReady(true);
              }
            }
          });
        });
      })
      .catch(() => {
        // ignore
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [canRegisterSw]);

  if (isOps) {
    // Ops должен быть “как Wolt Merchant”: без consumer header/search/cart/footer.
    return <>{children}</>;
  }

  const isHomePage = pathname === '/';
  const isOrderPage = pathname === '/order' || pathname.startsWith('/order/');
  const isProfilePage = pathname === '/profile' || pathname.startsWith('/profile/');
  const isCatalogPage = pathname === '/products' || pathname.startsWith('/products');

  return (
    <CartProvider>
      {/* Header скрыт на главной, каталоге, оформлении заказа и в профиле */}
      {!isHomePage && !isOrderPage && !isProfilePage && !isCatalogPage && <HeaderPremium />}
      <main className="flex-1 pb-[56px]">{children}</main>
      {/* Footer временно отключён (©, телефон, время работы, Сервер подключен) */}
      {/* {!isHomePage && <Footer />} */}
      <MobileBottomNav />
      <NotificationContainer />
      {updateReady ? (
        <UpdateAvailableBanner
          onReload={() => {
            const w = waitingRef.current;
            if (w) {
              w.postMessage({ type: 'SKIP_WAITING' });
              return;
            }
            window.location.reload();
          }}
          onDismiss={() => setUpdateReady(false)}
        />
      ) : null}
      <InstallPromptBanner disabled={updateReady} />
    </CartProvider>
  );
}


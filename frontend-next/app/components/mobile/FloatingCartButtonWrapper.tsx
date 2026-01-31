/**
 * Обертка для FloatingCartButton
 * Необходима для использования в Server Component (layout.tsx)
 * с динамическим импортом без ssr: false
 */
'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CartModalContainer from '@/app/components/cart/CartModalContainer';
import { usePathname } from 'next/navigation';
import FloatingSearchPill from './FloatingSearchPill';

const FloatingCartButton = dynamic(
  () => import('./FloatingCartButton'),
  { ssr: false } // Только на клиенте, так как использует useCart и useRouter
);

export default function FloatingCartButtonWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Render pills via portal to avoid "fixed inside transform" issues on mobile browsers */}
      {mounted
        ? createPortal(
            <>
              {!isOpen && pathname?.startsWith('/products') && <FloatingSearchPill />}
              {!isOpen && <FloatingCartButton onOpenCart={openCart} />}
            </>,
            document.body
          )
        : null}
      <CartModalContainer isOpen={isOpen} onClose={closeCart} />
    </>
  );
}

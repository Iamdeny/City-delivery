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
const FloatingCartButton = dynamic(
  () => import('./FloatingCartButton'),
  { ssr: false } // Только на клиенте, так как использует useCart и useRouter
);

export default function FloatingCartButtonWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted
        ? createPortal(
            !isOpen ? <FloatingCartButton onOpenCart={openCart} /> : null,
            document.body
          )
        : null}
      <CartModalContainer isOpen={isOpen} onClose={closeCart} />
    </>
  );
}

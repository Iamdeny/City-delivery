/**
 * Страница корзины
 * Фаза 7: Миграция страниц
 */
'use client';

import Breadcrumbs from '@/app/components/navigation/Breadcrumbs';
import CartModalContainer from '@/app/components/cart/CartModalContainer';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    router.push('/products');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 pt-[var(--safe-top)] lg:pt-0">
      <div className="hidden lg:block max-w-[1440px] mx-auto content-x pt-4">
        <Breadcrumbs />
      </div>
      <CartModalContainer
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </div>
  );
}

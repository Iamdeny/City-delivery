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
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:block container mx-auto px-4 pt-4">
        <Breadcrumbs />
      </div>
      <CartModalContainer
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </div>
  );
}

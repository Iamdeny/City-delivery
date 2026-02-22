/**
 * BottomNav — Premium 2026
 * Высота 84px (включая Safe Area для iOS). Glassmorphism.
 * 4 вкладки: Главная, Каталог, Корзина, Профиль.
 */
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/app/hooks/useCart';
import { Home, Grid3X3, ShoppingBag, User } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { totalItems } = useCart();

  const items: NavItem[] = [
    { key: 'home', label: 'Главная', icon: <Home className="w-5 h-5" />, href: '/' },
    { key: 'catalog', label: 'Каталог', icon: <Grid3X3 className="w-5 h-5" />, href: '/products' },
    { key: 'cart', label: 'Корзина', icon: <ShoppingBag className="w-5 h-5" />, href: '/cart' },
    { key: 'profile', label: 'Профиль', icon: <User className="w-5 h-5" />, href: '/profile' },
  ];

  const handleClick = (item: NavItem) => {
    if (pathname === item.href) return;
    router.push(item.href);
  };

  if (pathname.startsWith('/ops')) return null;

  return (
    <nav
      aria-label="Основная навигация"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[900] border-t border-gray-100 bg-white/90 backdrop-blur-md"
      style={{
        height: 'calc(var(--premium-bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'var(--premium-margin-mobile)',
        paddingRight: 'var(--premium-margin-mobile)',
      }}
    >
      <div className="flex items-center justify-between h-full max-w-[430px] mx-auto">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.key === 'home' && pathname === '/') ||
            (item.key === 'catalog' && pathname.startsWith('/products')) ||
            (item.key === 'cart' && pathname.startsWith('/cart')) ||
            (item.key === 'profile' && pathname.startsWith('/profile'));
          const isCart = item.key === 'cart';

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item)}
              className={`relative flex flex-col items-center justify-center flex-1 py-2 text-[11px] font-medium min-h-[44px] transition-colors ${
                active ? 'text-[var(--premium-accent)]' : 'text-[var(--premium-text-secondary)]'
              }`}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full mb-0.5 ${
                  active ? 'bg-[var(--premium-accent)]/10' : ''
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, {
                  className: 'w-5 h-5',
                  style: active ? { color: 'var(--premium-accent)' } : undefined,
                })}
              </div>
              <span>{item.label}</span>
              {isCart && totalItems > 0 && (
                <span
                  className="absolute top-1 right-1/4 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--premium-accent)] text-white text-[10px] font-bold flex items-center justify-center"
                  aria-label={`В корзине ${totalItems} товаров`}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

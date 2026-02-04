'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/app/hooks/useCart';
import { Home, Grid3X3, ShoppingBag, User } from 'lucide-react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { totalItems } = useCart();

  const items: NavItem[] = [
    {
      key: 'home',
      label: 'Главная',
      icon: <Home className="w-5 h-5" />,
      href: '/',
    },
    {
      key: 'catalog',
      label: 'Каталог',
      icon: <Grid3X3 className="w-5 h-5" />,
      href: '/products',
    },
    {
      key: 'cart',
      label: 'Корзина',
      icon: <ShoppingBag className="w-5 h-5" />,
      href: '/cart',
    },
    {
      key: 'profile',
      label: 'Профиль',
      icon: <User className="w-5 h-5" />,
      href: '/profile',
    },
  ];

  const handleClick = (item: NavItem) => {
    if (pathname === item.href) return;
    router.push(item.href);
  };

  // Не показываем на десктопе и в админке /ops
  if (pathname.startsWith('/ops')) return null;

  return (
    <nav
      aria-label="Основная навигация"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[900]
                 border-t border-gray-200 bg-white/95 backdrop-blur-md
                 pb-[calc(env(safe-area-inset-bottom,0px)+4px)] pt-1.5"
    >
      <div className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between">
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
                className={`relative flex flex-col items-center justify-center flex-1 py-1.5
                           text-[11px] font-medium transition-colors
                           ${active ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full mb-0.5
                              ${active ? 'bg-blue-100' : 'bg-transparent'}`}
                >
                  {item.icon}
                </div>
                <span>{item.label}</span>

                {isCart && totalItems > 0 && (
                  <span className="absolute -top-0.5 right-[18%] min-w-[18px] h-[18px] px-1
                                   rounded-full bg-[#ff4d6a] text-white text-[10px] font-semibold
                                   flex items-center justify-center leading-none">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}


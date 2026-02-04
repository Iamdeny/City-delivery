/**
 * Premium Header — стиль Banani / Самокат
 * Мигрировано из frontend/src/components/Header/HeaderPremium.tsx
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '../search/SearchBar';
import SearchModal from '../search/SearchModal';
import { PriceDisplay } from '../shared/ui/PriceDisplay';
import { useCart } from '@/app/hooks/useCart';
import { authService } from '@/app/services/authService';
import type { User } from '@/app/services/authService';
import { useNotifications } from '@/app/hooks/useNotifications';
import { logger } from '@/lib/logger';
import { ShoppingCart, RefreshCw, User as UserIcon, MapPin, ChevronDown } from 'lucide-react';

interface HeaderPremiumProps {
  onSearchChange?: (query: string) => void;
  onRefreshProducts?: () => void;
  deliveryAddress?: string;
  onAddressClick?: () => void;
  className?: string;
}

type DarkStore = {
  id: number;
  name: string;
  address?: string | null;
  delivery_radius?: number | null;
  distance_km?: number | null;
};

type GeocodeResult = { id: number; label: string; lat: number; lng: number };

export default function HeaderPremium({
  onSearchChange,
  onRefreshProducts,
  deliveryAddress = 'Доставка до дома',
  onAddressClick,
  className = '',
}: HeaderPremiumProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalItems, totalAmount, hasItems } = useCart();
  const { showNotification } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const [prevCartItems, setPrevCartItems] = useState(0);
  const [cartPulse, setCartPulse] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Dark Store First: selected store for catalog + checkout
  const [storeOpen, setStoreOpen] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [nearestLoading, setNearestLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [addressText, setAddressText] = useState<string>('');
  const [geoQ, setGeoQ] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<GeocodeResult[]>([]);

  // Устанавливаем mounted после монтирования компонента (только на клиенте)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Init selected store from URL or localStorage
  useEffect(() => {
    if (!mounted) return;
    const fromUrlRaw = searchParams?.get('dark_store_id');
    const fromUrl = fromUrlRaw ? Number(fromUrlRaw) : NaN;
    const fromLs = Number(localStorage.getItem('cd_dark_store_id') || 0);
    const next =
      Number.isFinite(fromUrl) && fromUrl > 0 ? Math.floor(fromUrl) : fromLs > 0 ? Math.floor(fromLs) : null;
    setSelectedStoreId((prev) => (prev === next ? prev : next));
  }, [mounted, searchParams]);

  // Init address (used for geocoding + UX)
  useEffect(() => {
    if (!mounted) return;
    try {
      const a = localStorage.getItem('cd_address') || '';
      setAddressText(a);
      setGeoQ(a);
    } catch {
      // ignore
    }
  }, [mounted]);

  const fetchStores = useCallback(async () => {
    setStoresError(null);
    setStoresLoading(true);
    try {
      const res = await fetch('/api/dark-stores?includeInactive=false', { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.stores) ? (data.stores as DarkStore[]) : [];
      setStores(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось загрузить склады';
      setStoresError(msg);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  // Resolve store name in header even if picker wasn't opened
  useEffect(() => {
    if (!mounted) return;
    if (!selectedStoreId) return;
    if (stores.length > 0 || storesLoading) return;
    void fetchStores();
  }, [fetchStores, mounted, selectedStoreId, stores.length, storesLoading]);

  const selectedStoreName = useMemo(() => {
    if (!selectedStoreId) return null;
    const s = stores.find((x) => Number(x.id) === Number(selectedStoreId)) || null;
    return s?.name || null;
  }, [selectedStoreId, stores]);

  // Banani: в шапке показываем адрес/доставку, а не «Выберите склад»
  const headerMainLabel = addressText?.trim() || deliveryAddress;
  const headerTimeLabel = 'Самокат 15 мин';

  const applyStoreToUrl = useCallback(
    (darkStoreId: number) => {
      const id = Math.floor(Number(darkStoreId));
      if (!Number.isFinite(id) || id <= 0) return;

      try {
        localStorage.setItem('cd_dark_store_id', String(id));
      } catch {
        // ignore
      }
      setSelectedStoreId(id);

      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('dark_store_id', String(id));

      const p = pathname ?? '';
      const isCatalog = p.startsWith('/products');
      const isCheckout = p.startsWith('/order');

      if (isCatalog) {
        router.replace(`/products?${params.toString()}`);
      } else if (isCheckout) {
        router.replace(`/order?${params.toString()}`);
      } else {
        router.push(`/products?${params.toString()}`);
      }
    },
    [pathname, router, searchParams]
  );

  const detectNearestStore = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showNotification('Геолокация недоступна. Выберите склад вручную.', 'error');
      return;
    }
    setStoresError(null);
    setNearestLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          maximumAge: 300000,
          enableHighAccuracy: true,
        });
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const res = await fetch(`/api/dark-stores/nearest?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showNotification(String(data?.message || data?.error || 'Доставка недоступна'), 'error');
        return;
      }
      const id = Number(data?.selected?.darkStoreId ?? data?.store?.id ?? 0);
      if (!id) {
        showNotification('Не удалось выбрать ближайший склад', 'error');
        return;
      }
      applyStoreToUrl(id);
      setStoreOpen(false);
      showNotification(`Выбран ближайший склад: ${String(data?.store?.name || `#${id}`)}`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Не удалось определить ближайший склад';
      showNotification(msg, 'error');
    } finally {
      setNearestLoading(false);
    }
  }, [applyStoreToUrl, showNotification]);

  const geocode = useCallback(async () => {
    const q = geoQ.trim();
    if (!q) {
      setGeoResults([]);
      return;
    }
    setGeoLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`, { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.results) ? (data.results as GeocodeResult[]) : [];
      setGeoResults(list);
    } catch {
      setGeoResults([]);
    } finally {
      setGeoLoading(false);
    }
  }, [geoQ]);

  const selectAddressAndStore = useCallback(
    async (r: GeocodeResult) => {
      const lat = Number(r.lat);
      const lng = Number(r.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      try {
        localStorage.setItem('cd_address', r.label);
        localStorage.setItem('cd_geo_lat', String(lat));
        localStorage.setItem('cd_geo_lng', String(lng));
      } catch {
        // ignore
      }
      setAddressText(r.label);
      setGeoQ(r.label);
      setGeoResults([]);

      setNearestLoading(true);
      try {
        const res = await fetch(
          `/api/dark-stores/nearest?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!res.ok || !data?.success) {
          showNotification(String(data?.message || data?.error || 'Доставка недоступна'), 'error');
          return;
        }
        const id = Number(data?.selected?.darkStoreId ?? data?.store?.id ?? 0);
        if (!id) {
          showNotification('Не удалось выбрать ближайший склад', 'error');
          return;
        }
        applyStoreToUrl(id);
        setStoreOpen(false);
        showNotification(`Склад выбран: ${String(data?.store?.name || `#${id}`)}`, 'success');
      } finally {
        setNearestLoading(false);
      }
    },
    [applyStoreToUrl, showNotification]
  );

  // Проверка авторизации при загрузке (отложенная, чтобы не блокировать рендеринг)
  useEffect(() => {
    if (!mounted) return;
    
    // Откладываем проверку авторизации, чтобы не блокировать LCP
    const timeoutId = setTimeout(() => {
      const checkAuth = async () => {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          logger.error('Ошибка проверки авторизации:', error);
        }
      };
      checkAuth();
    }, 100); // Небольшая задержка для неблокирующего рендеринга
    
    return () => clearTimeout(timeoutId);
  }, [mounted]);

  // Отслеживание скролла для sticky header
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const isProducts = (pathname ?? '').startsWith('/products');
      // На /products даем больше "прозрачной зоны" под hero, как у Samokat
      const threshold = isProducts ? 220 : 50;
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // CSS-переменная высоты мобильной шапки для sticky-элементов ниже
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(
      '--mobile-header-h',
      '64px'
    );
    return () => {
      // не очищаем, чтобы не прыгало при навигации
    };
  }, []);

  // Синхронизируем значение поиска с URL на /products
  const urlSearch = useMemo(() => {
    const v = searchParams?.get('search') ?? '';
    return v;
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;
    if (!pathname?.startsWith('/products')) return;
    setSearchValue((prev) => (prev === urlSearch ? prev : urlSearch));
  }, [mounted, pathname, urlSearch]);

  // Pulse анимация при изменении корзины (только после монтирования)
  useEffect(() => {
    if (!mounted) return;
    
    if (totalItems > prevCartItems) {
      setCartPulse(true);
      setTimeout(() => setCartPulse(false), 600);
    }
    setPrevCartItems(totalItems);
  }, [totalItems, prevCartItems, mounted]);

  const handleLoginClick = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      showNotification('Вы вышли из системы', 'success');
      router.push('/');
    } catch (error) {
      logger.error('Ошибка выхода:', error);
      showNotification('Ошибка при выходе', 'error');
    }
  }, [router, showNotification]);

  const handleCartClick = useCallback(() => {
    router.push('/cart');
  }, [router]);

  const handleLogoClick = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleRefresh = useCallback(() => {
    if (onRefreshProducts) {
      setLoading(true);
      onRefreshProducts();
      setTimeout(() => setLoading(false), 1000);
    }
  }, [onRefreshProducts]);

  const handleAddressClick = useCallback(() => {
    if (onAddressClick) {
      onAddressClick();
    } else {
      setStoreOpen(true);
      if (stores.length === 0 && !storesLoading) {
        void fetchStores();
      }
    }
  }, [fetchStores, onAddressClick, stores.length, storesLoading]);

  const handleSearch = useCallback((query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    }

    const q = query.trim();
    const currentPath = pathname ?? '';
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (!q) {
      // Если мы не на каталоге — просто ничего не делаем
      if (!currentPath.startsWith('/products')) return;
      params.delete('search');
      const href = params.toString() ? `/products?${params.toString()}` : '/products';
      router.replace(href);
      return;
    }

    params.set('search', q);
    const href = `/products?${params.toString()}`;

    // Если уже в каталоге — не спамим history
    if (currentPath.startsWith('/products')) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }, [onSearchChange, pathname, router, searchParams]);

  const isProducts = (pathname ?? '').startsWith('/products');
  const heroHeader = isProducts && !isScrolled;

  return (
    <>
      <motion.header
        className={`sticky top-0 left-0 right-0 z-[1000] transition-all duration-300 pt-[var(--safe-top)] md:pt-0
                  ${heroHeader ? 'bg-transparent border-transparent shadow-none backdrop-blur-0' : 'bg-white/95 backdrop-blur-md border-b border-gray-200'}
                  md:bg-gradient-to-r md:from-[#2563eb] md:to-[#3b82f6] md:border-b-0
                  ${heroHeader ? '' : (isScrolled ? 'shadow-md' : 'shadow-sm')} ${className}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 safe-x">
        {/* Десктопная версия */}
        <div className="hidden md:flex items-center gap-6 py-3">
          {/* Левая секция: Лого + Адрес */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={handleLogoClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex-shrink-0 drop-shadow-md">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                  <path
                    d="M16 8L20 12H18V20H14V12H12L16 8Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M10 22H22V24H10V22Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <defs>
                    <linearGradient
                      id="logo-gradient"
                      x1="0"
                      y1="0"
                      x2="32"
                      y2="32"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-bold text-white tracking-tight">Доставка</span>
                <span className="text-xs font-medium text-blue-200 opacity-90">за 15 минут</span>
              </div>
            </motion.div>

            {/* Address Bar — референс: синий акцент */}
            <motion.button
              className="flex items-center gap-2 px-3 py-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl max-w-[280px] transition-all hover:bg-white/25 hover:-translate-y-0.5 hover:shadow-lg"
              onClick={handleAddressClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin size={20} className="text-blue-300 flex-shrink-0" />
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-xs text-white/70 font-medium">{headerTimeLabel}</span>
                <span className="text-sm text-white font-semibold truncate w-full">
                  {headerMainLabel}
                </span>
              </div>
              <ChevronDown size={16} className="text-white/60 flex-shrink-0" />
            </motion.button>
          </div>

          {/* Центральная секция: Поиск */}
          <div className="flex-1 max-w-[600px]">
            <SearchBar
              onSearch={handleSearch}
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Найти продукты..."
              className="w-full"
            />
          </div>

          {/* Правая секция: Действия */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <motion.button
              className="w-11 h-11 flex items-center justify-center bg-white/15 backdrop-blur-md border border-white/20 rounded-full text-white transition-all hover:bg-white/25 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRefresh}
              whileHover={{ rotate: 180, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
              disabled={loading}
              aria-label="Обновить"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </motion.button>

            {/* Cart Button with Pulse — референс: синий */}
            <motion.button
              className={`flex items-center gap-2 px-3 py-2 bg-blue-600 rounded-2xl cursor-pointer transition-all relative overflow-hidden min-h-[48px] ${
                cartPulse ? 'animate-[cart-pulse_0.6s_ease]' : ''
              } hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg`}
              onClick={handleCartClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={cartPulse ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <ShoppingCart size={24} className="text-white" />
                {mounted && totalItems > 0 && (
                  <motion.span
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 border-2 border-blue-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {totalItems}
                  </motion.span>
                )}
              </div>
              {hasItems && (
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-lg font-bold text-white leading-none">
                    <PriceDisplay price={totalAmount} size="md" />
                  </span>
                  <span className="text-xs text-white/80 font-medium">~15 мин</span>
                </div>
              )}
            </motion.button>

            {/* User Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <motion.button
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl transition-all hover:bg-white/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white font-bold rounded-full text-sm">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-medium transition-all hover:bg-red-500/30 hover:border-red-500/50"
                  onClick={handleLogout}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Выйти
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <motion.button
                  className="px-4 py-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-lg text-white text-sm font-semibold whitespace-nowrap transition-all hover:bg-white/25"
                  onClick={handleLoginClick}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Войти
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-blue-600 border-none rounded-lg text-white text-sm font-semibold whitespace-nowrap transition-all hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() => router.push('/login')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Регистрация
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Мобильная версия (без поиска на стартовом экране) */}
        <div className="flex md:hidden flex-col gap-2 py-2 safe-top">
          {/* Первая строка: Лого + Адрес + Действия */}
          <div className="flex items-center gap-2">
            {!heroHeader && (
              <motion.div
                className="flex-shrink-0 cursor-pointer"
                onClick={handleLogoClick}
                whileTap={{ scale: 0.95 }}
              >
                <div className="drop-shadow-sm">
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                    <rect width="32" height="32" rx="6" fill="url(#mobile-logo-gradient)" />
                    <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="white" fillOpacity="0.9" />
                    <path d="M10 22H22V24H10V22Z" fill="white" fillOpacity="0.9" />
                    <defs>
                      <linearGradient id="mobile-logo-gradient" x1="0" y1="0" x2="32" y2="32">
                        <stop stopColor="#2563eb" />
                        <stop offset="1" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </motion.div>
            )}

            {/* Banani: адрес + «Самокат 15 мин», без «Выберите склад» */}
            <motion.button
              className={
                heroHeader
                  ? 'flex-1 min-w-0 flex items-start gap-2 px-0 py-0 bg-transparent border-0 rounded-none text-left'
                  : 'flex-1 flex items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-2xl cursor-pointer transition-colors min-w-0 active:bg-gray-50 shadow-sm'
              }
              onClick={handleAddressClick}
              whileTap={{ scale: 0.98 }}
            >
              {heroHeader ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[18px] font-extrabold text-white truncate">
                      {headerMainLabel}
                    </span>
                    <ChevronDown size={14} className="text-white/90 flex-shrink-0" />
                  </div>
                  <div className="text-[15px] font-semibold text-white/90 leading-tight">
                    {headerTimeLabel}
                  </div>
                </div>
              ) : (
                <>
                  <MapPin size={16} className="text-[#5a5a5a] flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[13px] font-semibold text-[#1a1a1a] truncate">
                      {headerMainLabel}
                    </div>
                    <div className="text-[11px] text-[#5a5a5a] truncate">{headerTimeLabel}</div>
                  </div>
                  <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />
                </>
              )}
            </motion.button>

            <div className="flex items-center gap-1">
              {/* Cart Button */}
              {!heroHeader && (
                <motion.button
                  className={`w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full cursor-pointer transition-all relative ${
                    cartPulse ? 'animate-[cart-pulse_0.6s_ease]' : ''
                  }`}
                  onClick={handleCartClick}
                  whileTap={{ scale: 0.9 }}
                  animate={cartPulse ? { scale: [1, 1.15, 1] } : {}}
                >
                  <ShoppingCart size={20} className="text-white" />
                  {mounted && totalItems > 0 && (
                    <motion.span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 border-2 border-white"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* User Button */}
              {user ? (
                <motion.button
                  className={
                    heroHeader
                      ? 'w-10 h-10 flex items-center justify-center bg-white/0 rounded-full text-white active:scale-90'
                      : 'w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-full text-gray-800 transition-colors active:bg-gray-100'
                  }
                  onClick={handleLogout}
                  whileTap={{ scale: 0.9 }}
                >
                  {heroHeader ? (
                    <UserIcon size={22} className="text-white" />
                  ) : (
                    <div className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full text-sm">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </motion.button>
              ) : (
                <motion.button
                  className={
                    heroHeader
                      ? 'w-10 h-10 flex items-center justify-center bg-white/0 rounded-full text-white active:scale-90'
                      : 'w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-full text-gray-800 transition-colors active:bg-gray-100'
                  }
                  onClick={handleLoginClick}
                  whileTap={{ scale: 0.9 }}
                >
                  <UserIcon size={22} className={heroHeader ? 'text-white' : undefined} />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>
      </motion.header>

      <SearchModal
        isOpen={isSearchModalOpen}
        initialValue={searchValue}
        onSubmit={handleSearch}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Dark Store picker (consumer) */}
      {storeOpen && (
        <div
          className="fixed inset-0 z-[1200] bg-black/50 flex items-end md:items-center justify-center p-3"
          onClick={() => setStoreOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-900">Выбор склада</div>
                <div className="text-xs text-gray-600 truncate">
                  Dark Store First: заказ только в радиусе доставки склада
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100"
                onClick={() => setStoreOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                type="button"
                className="w-full rounded-xl bg-gray-900 text-white text-sm font-extrabold px-4 py-3 disabled:opacity-60"
                onClick={() => void detectNearestStore()}
                disabled={nearestLoading}
              >
                {nearestLoading ? 'Определяем ближайший…' : 'Определить ближайший по геолокации'}
              </button>

              <div className="rounded-xl border border-gray-200 p-3">
                <div className="text-sm font-extrabold text-gray-900">Или укажите адрес</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
                    placeholder="Город, улица, дом…"
                    value={geoQ}
                    onChange={(e) => setGeoQ(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white disabled:opacity-60"
                    onClick={() => void geocode()}
                    disabled={geoLoading || nearestLoading}
                  >
                    {geoLoading ? '…' : 'Найти'}
                  </button>
                </div>
                {geoResults.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                      {geoResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50"
                            onClick={() => void selectAddressAndStore(r)}
                            disabled={nearestLoading}
                          >
                            <div className="text-sm font-bold text-gray-900">{r.label}</div>
                            <div className="text-xs text-gray-600">
                              {Number(r.lat).toFixed(5)}, {Number(r.lng).toFixed(5)}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-600">
                  Поиск адреса даёт стабильные координаты для “планомерного покрытия” (Dark Store First).
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-gray-900">Доступные склады</div>
                <button
                  type="button"
                  className="text-sm font-bold text-gray-700 hover:underline disabled:opacity-60"
                  onClick={() => void fetchStores()}
                  disabled={storesLoading || nearestLoading}
                >
                  Обновить
                </button>
              </div>

              {storesError && <div className="text-sm text-red-600">{storesError}</div>}

              <div className="max-h-[45vh] overflow-auto rounded-xl border border-gray-200">
                {storesLoading && stores.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">Загрузка…</div>
                ) : stores.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">Склады не найдены</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {stores.map((s) => {
                      const active = Number(s.id) === Number(selectedStoreId);
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                              active ? 'bg-gray-50' : 'bg-white'
                            }`}
                            onClick={() => {
                              applyStoreToUrl(Number(s.id));
                              setStoreOpen(false);
                              showNotification(`Выбран склад: ${s.name}`, 'success');
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-gray-900 truncate">{s.name}</div>
                                {s.address ? (
                                  <div className="text-xs text-gray-600 truncate">{s.address}</div>
                                ) : null}
                              </div>
                              {active ? (
                                <div className="text-xs font-extrabold text-green-700">выбран</div>
                              ) : (
                                <div className="text-xs font-bold text-gray-500">выбрать</div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

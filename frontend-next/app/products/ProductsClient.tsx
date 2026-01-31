/**
 * Client Component для интерактивности на странице продуктов
 * Использует хуки для состояния корзины и фильтров
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/app/hooks/useCart';
import { useProductFilters, type SortOption } from '@/app/hooks/useProductFilters';
import ProductGrid from '@/app/components/product/ProductGrid';
import FiltersSidebar from '@/app/components/filters/FiltersSidebar';
import CategoryNav from '@/app/components/navigation/CategoryNav';
import MobileFiltersDrawer from '@/app/components/filters/MobileFiltersDrawer';
import type { Product } from '@/types';
import { ChevronRight, X, Search } from 'lucide-react';

function sortLabel(option: SortOption): string {
  switch (option) {
    case 'relevance':
      return 'Релевантность';
    case 'price-asc':
      return 'Цена ↑';
    case 'price-desc':
      return 'Цена ↓';
    case 'name-asc':
      return 'А‑Я';
    case 'name-desc':
      return 'Я‑А';
    default:
      return 'Сортировка';
  }
}

interface ProductsClientProps {
  products: Product[];
  initialCategory?: string;
  initialCategories?: string[];
  initialSearch?: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  initialSortOption?: SortOption;
}

export default function ProductsClient({
  products,
  initialCategory,
  initialCategories,
  initialSearch,
  initialMinPrice,
  initialMaxPrice,
  initialSortOption,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Хуки для корзины и фильтров
  const { cart, totalItems, addToCart, decrementQuantity } = useCart();
  
  // Мемоизируем пропсы для useProductFilters
  const productFiltersProps = useMemo(() => ({ products }), [products]);
  
  // Хук фильтрации
  const filtersResult = useProductFilters(productFiltersProps);
  
  const {
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    minPrice,
    maxPrice,
    allCategories,
    filteredProducts,
    activeFiltersCount,
    setSearchQuery: originalSetSearchQuery,
    setSelectedCategories: originalSetSelectedCategories,
    setPriceRange: originalSetPriceRange,
    setSortOption: originalSetSortOption,
    resetFilters: originalResetFilters,
  } = filtersResult;
  
  // Обертываем сеттеры в startTransition
  const setSearchQuery = useCallback((query: string) => {
    startTransition(() => {
      originalSetSearchQuery(query);
    });
  }, [originalSetSearchQuery]);
  
  const setSelectedCategories = useCallback((categories: string[]) => {
    startTransition(() => {
      originalSetSelectedCategories(categories);
    });
  }, [originalSetSelectedCategories]);
  
  const setPriceRange = useCallback((range: [number, number]) => {
    startTransition(() => {
      originalSetPriceRange(range);
    });
  }, [originalSetPriceRange]);
  
  const setSortOption = useCallback((option: typeof sortOption) => {
    startTransition(() => {
      originalSetSortOption(option);
    });
  }, [originalSetSortOption]);
  
  const resetFilters = useCallback(() => {
    startTransition(() => {
      originalResetFilters();
    });
  }, [originalResetFilters]);
  
  const handleResetAllFilters = useCallback(() => {
    resetFilters();
    // также очищаем URL, чтобы фильтры не "возвращались" из query string
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('category');
    params.delete('categories');
    params.delete('search');
    params.delete('minPrice');
    params.delete('maxPrice');
    params.delete('sort');
    const href = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(href);
  }, [resetFilters, router, searchParams]);

  // Синхронизация фильтров с URL параметрами (без бесконечных циклов)
  const initialSelectedCategories = useMemo(() => {
    if (Array.isArray(initialCategories) && initialCategories.length > 0) {
      return initialCategories;
    }
    return initialCategory ? [initialCategory] : [];
  }, [initialCategories, initialCategory]);

  const prevUrlRef = useRef<string>('');
  useEffect(() => {
    const key = [
      initialSelectedCategories.join(','),
      initialSearch ?? '',
      initialMinPrice ?? '',
      initialMaxPrice ?? '',
      initialSortOption ?? '',
      // computed bounds affect how we treat defaults
      minPrice,
      maxPrice,
    ].join('|');
    if (prevUrlRef.current === key) return;
    prevUrlRef.current = key;

    // category/categories
    if (selectedCategories.join(',') !== initialSelectedCategories.join(',')) {
      setSelectedCategories(initialSelectedCategories);
    }

    // search
    const nextSearch = initialSearch ?? '';
    if (searchQuery !== nextSearch) {
      setSearchQuery(nextSearch);
    }

    // priceRange
    const desiredMin = typeof initialMinPrice === 'number' ? Math.max(minPrice, Math.floor(initialMinPrice)) : minPrice;
    const desiredMax = typeof initialMaxPrice === 'number' ? Math.min(maxPrice, Math.floor(initialMaxPrice)) : maxPrice;
    const normalized: [number, number] =
      desiredMax > desiredMin ? [desiredMin, desiredMax] : [minPrice, maxPrice];
    if (priceRange[0] !== normalized[0] || priceRange[1] !== normalized[1]) {
      setPriceRange(normalized);
    }

    // sort
    const desiredSort: SortOption = initialSortOption ?? 'relevance';
    if (sortOption !== desiredSort) {
      setSortOption(desiredSort);
    }
  }, [
    initialSearch,
    initialSelectedCategories,
    initialMinPrice,
    initialMaxPrice,
    initialSortOption,
    minPrice,
    maxPrice,
    searchQuery,
    selectedCategories,
    priceRange,
    sortOption,
    setSearchQuery,
    setSelectedCategories,
    setPriceRange,
    setSortOption,
  ]);

  const setCategoriesInUrl = useCallback((categories: string[]) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    if (categories.length === 0) {
      params.delete('category');
      params.delete('categories');
    } else if (categories.length === 1) {
      params.set('category', categories[0]);
      params.delete('categories');
    } else {
      params.set('categories', categories.join(','));
      params.delete('category');
    }

    const href = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(href);
  }, [router, searchParams]);

  const setPriceInUrl = useCallback((range: [number, number]) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    const [min, max] = range;

    // Если выбран полный диапазон — не засоряем URL
    if (min <= minPrice && max >= maxPrice) {
      params.delete('minPrice');
      params.delete('maxPrice');
    } else {
      params.set('minPrice', String(Math.floor(min)));
      params.set('maxPrice', String(Math.floor(max)));
    }

    const href = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(href);
  }, [maxPrice, minPrice, router, searchParams]);

  const setSortInUrl = useCallback((option: SortOption) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (option === 'relevance') {
      params.delete('sort');
    } else {
      params.set('sort', option);
    }
    const href = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(href);
  }, [router, searchParams]);

  const handleQuickCategoryChange = useCallback((categories: string[]) => {
    // Для быстрых "чипов" — одиночный выбор (или сброс)
    const next = categories.slice(0, 1);
    setCategoriesInUrl(next);
    setSelectedCategories(next);
  }, [setCategoriesInUrl, setSelectedCategories]);

  const handleCategoriesChange = useCallback((categories: string[]) => {
    setCategoriesInUrl(categories);
    setSelectedCategories(categories);
  }, [setCategoriesInUrl, setSelectedCategories]);

  const handlePriceChange = useCallback((range: [number, number]) => {
    setPriceInUrl(range);
    setPriceRange(range);
  }, [setPriceInUrl, setPriceRange]);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortInUrl(option);
    setSortOption(option);
  }, [setSortInUrl, setSortOption]);

  const popularCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const c = (p.category ?? '').trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ru'))
      .map(([name]) => name);
  }, [products]);

  // Samokat-like hint on hero (mobile)
  const [addressHintOpen, setAddressHintOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'cd:address-hint-dismissed:v1';
    const dismissed = window.localStorage.getItem(key) === '1';
    if (!dismissed) setAddressHintOpen(true);
  }, []);

  const dismissAddressHint = useCallback(() => {
    setAddressHintOpen(false);
    try {
      window.localStorage.setItem('cd:address-hint-dismissed:v1', '1');
    } catch {
      // ignore
    }
  }, []);

  const featuredShelfProducts = useMemo(() => {
    return (filteredProducts.length > 0 ? filteredProducts : products).slice(0, 8);
  }, [filteredProducts, products]);
  
  const clearSearchInUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('search');
    const href = params.toString() ? `/products?${params.toString()}` : '/products';
    router.replace(href);
    setSearchQuery('');
  }, [router, searchParams, setSearchQuery]);

  const removeSelectedCategory = useCallback((category: string) => {
    const next = selectedCategories.filter((c) => c !== category);
    setCategoriesInUrl(next);
    setSelectedCategories(next);
  }, [selectedCategories, setCategoriesInUrl, setSelectedCategories]);

  const clearCategories = useCallback(() => {
    setCategoriesInUrl([]);
    setSelectedCategories([]);
  }, [setCategoriesInUrl, setSelectedCategories]);

  const clearPrice = useCallback(() => {
    handlePriceChange([minPrice, maxPrice]);
  }, [handlePriceChange, minPrice, maxPrice]);

  const clearSort = useCallback(() => {
    handleSortChange('relevance');
  }, [handleSortChange]);

  const FilterChip = ({
    label,
    onRemove,
    ariaRemoveLabel,
  }: {
    label: string;
    onRemove: () => void;
    ariaRemoveLabel: string;
  }) => (
    <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] bg-white border border-gray-200 text-xs font-semibold text-[#1a1a1a] shadow-sm">
      <span className="truncate max-w-[160px]">{label}</span>
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-gray-100 text-[#404040] flex items-center justify-center active:scale-95 hover:bg-gray-200 transition-colors"
        onClick={onRemove}
        aria-label={ariaRemoveLabel}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Поисковая строка в стиле Самоката (только на мобильных) */}
      <div className="lg:hidden mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const params = new URLSearchParams(searchParams?.toString() ?? '');
              if (e.target.value.trim()) {
                params.set('search', e.target.value.trim());
              } else {
                params.delete('search');
              }
              const href = params.toString() ? `/products?${params.toString()}` : '/products';
              router.replace(href);
            }}
            placeholder="Искать в Самокате"
            className="w-full h-[44px] pl-12 pr-4 bg-[#f2f2f2] border-0 rounded-xl text-base font-normal text-[#1a1a1a] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:bg-white transition-all"
            style={{
              fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif',
            }}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Левая панель - FiltersSidebar (только на десктопе) */}
      <aside className="hidden lg:block flex-shrink-0 w-64">
        {products.length > 0 && (
          <FiltersSidebar
            minPrice={minPrice}
            maxPrice={maxPrice}
            priceRange={priceRange}
            onPriceChange={handlePriceChange}
            categories={allCategories}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoriesChange}
            sortOption={sortOption}
            onSortChange={handleSortChange}
            onResetFilters={handleResetAllFilters}
            productsCount={products.length}
            filteredProductsCount={filteredProducts.length}
            variant="sidebar"
          />
        )}
      </aside>

      {/* Центральная часть - Товары */}
      <div className="flex-1">
        {/* Samokat-like hero + "white sheet" (mobile only) */}
        <div className="lg:hidden -mx-4">
          <section
            className="relative h-[420px] overflow-hidden"
            aria-label="Главный баннер"
          >
            {/* Decorative "photo-like" background (placeholder) */}
            <div className="absolute inset-0 bg-[radial-gradient(1200px_500px_at_30%_30%,rgba(255,255,255,0.22),transparent_60%),radial-gradient(900px_480px_at_70%_35%,rgba(255,211,155,0.22),transparent_55%),linear-gradient(180deg,#4b3b2b_0%,#9c6f3f_40%,#f0e7db_100%)]" />
            <div className="absolute inset-0 bg-black/15" />

            {/* Address hint bubble */}
            {addressHintOpen && (
              <div className="absolute left-4 right-4 top-[calc(var(--mobile-header-h,64px)+22px)]">
                <div className="inline-flex items-start gap-3 rounded-2xl bg-[#2b2b2e]/90 text-white px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
                  <div className="text-[15px] font-semibold leading-snug">
                    Кажется, не тот адрес!
                    <br />
                    Точно привезти сюда?
                  </div>
                  <button
                    type="button"
                    className="ml-auto -mr-1 -mt-0.5 w-8 h-8 rounded-full flex items-center justify-center text-white/80 active:scale-95"
                    onClick={dismissAddressHint}
                    aria-label="Закрыть подсказку"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Hero title */}
            <div className="absolute left-4 right-4 bottom-[86px]">
              <div className="text-white text-[26px] font-bold tracking-tight drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                Скоро Пасха!
              </div>
            </div>

            {/* Dots */}
            <div className="absolute left-0 right-0 bottom-[56px] flex items-center justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${i === 0 ? 'bg-white' : 'bg-white/35'}`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </section>

          {/* White sheet */}
          <section className="-mt-7 bg-white rounded-t-[28px] shadow-[0_-10px_26px_rgba(0,0,0,0.10)] pt-4">
            <div className="px-4 flex items-center justify-between gap-3">
              <h2 className="text-[22px] font-bold text-gray-800">Выгодная полка</h2>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-500 active:scale-[0.99]"
                onClick={() => {
                  // пока ведем на начало каталога (позже можно на отдельную витрину)
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-label="Открыть раздел полностью"
              >
                Больше <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 px-4 -mr-4">
              <div className="flex gap-3 overflow-x-auto pb-3 pr-4 snap-x snap-mandatory">
                {/* Promo tile */}
                <button
                  type="button"
                  className="snap-start flex-shrink-0 w-[168px] h-[206px] rounded-[26px] overflow-hidden border border-gray-100 shadow-sm bg-white active:scale-[0.99]"
                  aria-label="Все скидки и акции"
                >
                  <div className="h-[106px] bg-[#ff3363] px-4 py-3">
                    <div className="text-white text-[16px] font-bold leading-tight">
                      Все скидки
                      <br />
                      и акции
                    </div>
                  </div>
                  <div className="h-[100px] bg-[#f2f2f2] flex items-center justify-center">
                    <div className="text-[64px] font-bold text-gray-800 leading-none">%</div>
                  </div>
                </button>

                {featuredShelfProducts.map((p) => (
                  <div
                    key={p.id}
                    className="snap-start flex-shrink-0 w-[168px] h-[206px] rounded-[26px] overflow-hidden border border-gray-100 shadow-sm bg-white"
                  >
                    <div className="h-[118px] bg-[#f2f2f2] flex items-center justify-center rounded-t-[26px] relative overflow-hidden">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain p-2"
                          loading="lazy"
                        />
                      ) : (
                        // Пытаемся использовать изображение из папки bargain-shelf
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/images/bargain-shelf/${p.id}.jpg`}
                          alt={p.name}
                          className="w-full h-full object-contain p-2"
                          loading="lazy"
                          onError={(e) => {
                            // Если изображение не найдено, показываем placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      )}
                      {/* Placeholder, если изображение не загрузилось */}
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[42px] absolute inset-0" style={{ display: p.image ? 'none' : 'flex' }}>
                        ⬤
                      </div>
                    </div>
                    <div className="px-3 pt-2.5 pb-3">
                      <div className="text-[15px] font-bold text-gray-800">
                        {Math.round(p.price).toLocaleString('ru-RU')} ₽
                      </div>
                      <div
                        className="mt-1 text-[13px] font-medium text-gray-700 leading-snug overflow-hidden"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {p.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider to separate from sticky filters bar */}
            <div className="h-3" />
          </section>
        </div>

        {/* Мобайл: липкая панель под шапкой (категории + фильтры) */}
        <div
          className="lg:hidden sticky top-[calc(var(--mobile-header-h,112px)+var(--safe-top))] z-[900]
                     -mx-4 px-4 py-3 mb-3
                     bg-white backdrop-blur-md border-b border-gray-100"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                {allCategories.length > 0 && (
                  <CategoryNav
                    categories={allCategories}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleQuickCategoryChange}
                    singleSelect
                    className="-mx-4 px-4"
                  />
                )}
              </div>
              {products.length > 0 && (
                <div className="pt-0.5 flex-shrink-0">
                  <MobileFiltersDrawer
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    priceRange={priceRange}
                    onPriceChange={handlePriceChange}
                    categories={allCategories}
                    selectedCategories={selectedCategories}
                    onCategoryChange={handleCategoriesChange}
                    sortOption={sortOption}
                    onSortChange={handleSortChange}
                    onResetFilters={handleResetAllFilters}
                    productsCount={products.length}
                    filteredProductsCount={filteredProducts.length}
                    activeFiltersCount={activeFiltersCount}
                  />
                </div>
              )}
            </div>

                {activeFiltersCount > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-x-auto pr-1 scrollbar-hide">
                      {searchQuery.trim() && (
                        <FilterChip
                          label={`Поиск: ${searchQuery.trim().slice(0, 18)}${searchQuery.trim().length > 18 ? '…' : ''}`}
                          onRemove={clearSearchInUrl}
                          ariaRemoveLabel="Убрать фильтр поиска"
                        />
                      )}
                      {selectedCategories.length > 0 && (
                        <>
                          {selectedCategories.slice(0, 3).map((cat) => (
                            <FilterChip
                              key={cat}
                              label={cat}
                              onRemove={() => removeSelectedCategory(cat)}
                              ariaRemoveLabel={`Убрать категорию ${cat}`}
                            />
                          ))}
                          {selectedCategories.length > 3 && (
                            <button
                              type="button"
                              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 active:scale-[0.99]"
                              onClick={clearCategories}
                              aria-label="Убрать все категории"
                            >
                              +{selectedCategories.length - 3}
                            </button>
                          )}
                        </>
                      )}
                      {(priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
                        <FilterChip
                          label={`₽ ${priceRange[0]}–${priceRange[1]}`}
                          onRemove={clearPrice}
                          ariaRemoveLabel="Сбросить фильтр по цене"
                        />
                      )}
                      {sortOption !== 'relevance' && (
                        <FilterChip
                          label={sortLabel(sortOption)}
                          onRemove={clearSort}
                          ariaRemoveLabel="Сбросить сортировку"
                        />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleResetAllFilters}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-xs font-extrabold active:scale-95 transition-transform"
                      aria-label="Сбросить активные фильтры"
                    >
                      Сбросить всё
                    </button>
                  </div>
                )}
          </div>
        </div>

        <div
          className={
            // Когда плавающая корзина видима — добавляем нижний отступ,
            // чтобы последние карточки не прятались под кнопкой
            totalItems > 0
              ? 'pb-[calc(92px+var(--safe-bottom))]'
              : 'pb-[calc(72px+var(--safe-bottom))]'
          }
        >
          <ProductGrid
            products={products}
            filteredProducts={filteredProducts}
            loading={false}
            error={null}
            onAddToCart={addToCart}
            onRemoveFromCart={decrementQuantity}
            onRefreshProducts={() => window.location.reload()}
            onResetFilters={handleResetAllFilters}
            onClearSearch={clearSearchInUrl}
            popularCategories={popularCategories}
            onSelectCategory={(category) => handleQuickCategoryChange([category])}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            priceRange={priceRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            cart={cart}
          />
        </div>
      </div>
    </div>
  );
}

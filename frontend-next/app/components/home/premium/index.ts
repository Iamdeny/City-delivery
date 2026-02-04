/**
 * Premium 2026 — компоненты по спецификациям Instacart / DoorDash / Uber Eats
 * Подключите premium-2026.css в globals.css (уже подключено).
 *
 * Использование:
 * - HomeHeader: липкий хедер с адресом и аватаром
 * - SearchBar: строка поиска 48px, #F6F6F6, radius 24px
 * - PromoCarousel: баннеры 16:9, горизонтальный скролл
 * - CategoryGrid: табы категорий с активной полоской 2px
 * - ProductCard: карточка товара 2 колонки, 32×32 кнопка "+"
 * - CatalogGrid: сетка 2 колонки с gutter 12px
 * - ContentWrapper: отступы 16px, max-w-[430px]
 * - BottomNav: нижняя навигация 84px + Safe Area
 */

export { default as HomeHeader } from './HomeHeader';
export { default as SearchBar } from './SearchBar';
export { default as PromoCarousel } from './PromoCarousel';
export { default as CategoryGrid } from './CategoryGrid';
export { default as ProductCard } from './ProductCard';
export { default as CatalogGrid } from './CatalogGrid';
export { default as ContentWrapper } from './ContentWrapper';
export { default as BottomNav } from './BottomNav';

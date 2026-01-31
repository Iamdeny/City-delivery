/**
 * Premium Product Card - от Gorillas + Getir + Yandex
 * HD images, bold typography, smooth animations
 * Мигрировано из frontend/src/components/Product/ProductCardPremium.tsx
 */
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { Product } from '@/types';
import { useCartActions } from '@/app/hooks/useCartActions';
import { QuantityControls } from '@/app/components/shared/ui/QuantityControls';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import { formatPriceWithDiscount, formatPriceWithCurrency } from '@/lib/format';
import { isValidImageUrl } from '@/lib/utils';
import { Heart } from 'lucide-react';

interface ProductCardPremiumProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart?: (product: Product) => void;
  isInCart?: boolean;
  cartQuantity?: number;
  discount?: number;
  onQuickView?: (product: Product) => void;
}

// Placeholder изображение (data URI) - всегда доступно, не требует интернета
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7Qn9C+0LvRg9GH0LjRgtGMINC/0LXRgNC10L3QuNC1PC90ZXh0Pjwvc3ZnPg==';

function ProductCardPremium({
  product,
  onAddToCart,
  isInCart = false,
  cartQuantity = 0,
  onRemoveFromCart,
  discount,
  onQuickView,
}: ProductCardPremiumProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  
  // Избранное (favorites) - используем localStorage
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Загружаем состояние избранного из localStorage при монтировании
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const favoritesKey = `cd_favorite_${product.id}`;
    const saved = localStorage.getItem(favoritesKey);
    setIsFavorite(saved === 'true');
  }, [product.id]);
  
  // Обработчик переключения избранного
  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    const favoritesKey = `cd_favorite_${product.id}`;
    const newValue = !isFavorite;
    setIsFavorite(newValue);
    localStorage.setItem(favoritesKey, String(newValue));
  }, [isFavorite, product.id]);

  // Используем централизованную функцию проверки URL

  const isEmoji = useMemo(() => {
    const emojiCache = new Map<string, boolean>();
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return (str: string | undefined): boolean => {
      if (!str) return false;
      if (emojiCache.has(str)) return emojiCache.get(str)!;
      if (str.startsWith('http') || str.startsWith('data:') || str.startsWith('/')) {
        emojiCache.set(str, false);
        return false;
      }
      if (str.length <= 4 && !str.includes(' ') && !str.includes('/')) {
        const result = emojiRegex.test(str);
        emojiCache.set(str, result);
        return result;
      }
      emojiCache.set(str, false);
      return false;
    };
  }, []);

  // Мемоизируем изображение - используем локальные placeholder'ы
  // Откладываем проверку URL для оптимизации
  const productImage = useMemo(() => {
    // Если image - это эмодзи или невалидный URL, используем placeholder
    if (product.image) {
      // Быстрая проверка без try-catch для оптимизации
      if (product.image.startsWith('data:') || product.image.startsWith('/')) {
        return product.image;
      }
      if (isEmoji(product.image) || !isValidImageUrl(product.image)) {
        return getPlaceholderByCategory(product.category);
      }
      return product.image;
    }
    // Используем локальный placeholder по категории
    return getPlaceholderByCategory(product.category);
  }, [product.image, product.category, isEmoji]);

  // Инициализируем текущий источник изображения
  useEffect(() => {
    setCurrentImageSrc(productImage);
    setImageError(false);
    setImageLoaded(false);
  }, [productImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    // Если уже используем placeholder - не пытаемся снова
    if (currentImageSrc === PLACEHOLDER_IMAGE || currentImageSrc.startsWith('data:')) {
      return;
    }
    
    // Если текущий источник - это внешний URL и он не загрузился - переключаемся на data URI placeholder
    if (currentImageSrc !== PLACEHOLDER_IMAGE) {
      setImageError(true);
      setCurrentImageSrc(PLACEHOLDER_IMAGE);
    }
  };

  // Унифицированные обработчики через useCartActions
  const { handleAddToCart, handleIncrement, handleDecrement } = useCartActions({
    onAddToCart,
    onRemoveFromCart,
    product,
    cartQuantity,
  });

  const openQuickView = useCallback(() => {
    if (!onQuickView) return;
    onQuickView(product);
  }, [onQuickView, product]);

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    openQuickView();
  };

  // Вычисляем hasDiscount только для badge (цена обрабатывается в PriceDisplay)
  const hasDiscount = discount && discount > 0;
  const price = Number(product.price) || 0;
  const priceUi = hasDiscount ? formatPriceWithDiscount(price, Number(discount)) : null;

  // Парсим вес/объём из description (мл, г, шт, кг, л)
  const weightVolume = useMemo(() => {
    if (!product.description) return null;
    // Ищем паттерны: число + единица измерения (мл, г, шт, кг, л, гр, грамм, миллилитр, литр, килограмм)
    // Поддерживаем пробелы и различные варианты написания
    const match = product.description.match(/(\d+(?:[.,]\d+)?)\s*(мл|г|шт|кг|л|гр|грамм|миллилитр|литр|килограмм)/i);
    if (match) {
      const value = match[1];
      let unit = match[2].toLowerCase();
      // Нормализуем единицы измерения
      if (unit === 'гр' || unit === 'грамм') unit = 'г';
      if (unit === 'миллилитр') unit = 'мл';
      if (unit === 'литр') unit = 'л';
      if (unit === 'килограмм') unit = 'кг';
      return { value, unit };
    }
    return null;
  }, [product.description]);

  // Определяем, является ли изображение data URI
  const imageSrc = currentImageSrc || productImage;
  const isDataUri = imageSrc.startsWith('data:');
  
  // Проверяем валидность URL для next/image
  const isImageValidUrl = isValidImageUrl(imageSrc);

  // Откладываем инициализацию framer-motion для оптимизации LCP
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  useEffect(() => {
    // Откладываем анимации на следующий тик
    const timeoutId = setTimeout(() => {
      setShouldAnimate(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.div
      role={onQuickView ? 'button' : undefined}
      tabIndex={onQuickView ? 0 : undefined}
      onClick={openQuickView}
      onKeyDown={(e) => {
        if (!onQuickView) return;
        if (e.key === 'Enter' || e.key === ' ') openQuickView();
      }}
      className={`bg-white border-0 overflow-hidden flex flex-col cursor-pointer relative
                  transition-[transform,box-shadow] duration-200
                  active:scale-[0.99]
                  ${isInCart ? 'ring-1 ring-pink-200' : ''}`}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : undefined}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldAnimate ? { opacity: 0, scale: 0.9 } : undefined}
      whileHover={shouldAnimate ? { y: -2 } : undefined}
      transition={shouldAnimate ? { duration: 0.2 } : undefined}
    >
      {/* Image Container (Samokat-like) */}
      <div className="relative w-full aspect-square bg-[#f2f2f2] overflow-hidden rounded-[18px]" onClick={handleQuickView}>
        {/* Loading Skeleton */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        )}

        {/* Изображение - используем next/image для реальных изображений, обычный img для data URI */}
        {isDataUri || !isImageValidUrl ? (
          // Используем обычный img для data URI или невалидных URL
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-contain p-2 transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          // Используем next/image только для валидных URL
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-contain p-2 transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Samokat-like heart */}
        <motion.button
          type="button"
          className={`absolute top-2.5 right-2.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full backdrop-blur-md ring-1 shadow-sm flex items-center justify-center active:scale-[0.98] transition-colors ${
            isFavorite
              ? 'bg-pink-500/90 ring-pink-300/30 text-white'
              : 'bg-white/85 ring-black/5 text-gray-600'
          }`}
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          onClick={handleToggleFavorite}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            animate={{ scale: isFavorite ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.div>
        </motion.button>

        {/* Samokat-like discount badge (bottom-left) */}
        <AnimatePresence>
          {hasDiscount ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
              className="absolute bottom-2.5 left-2.5 rounded-[24px] bg-[#404040] text-white text-[11px] sm:text-[12px] font-bold px-[5px] py-[1px]"
            >
              −{discount}%
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Weight/Volume badge (bottom-right) */}
        <AnimatePresence>
          {weightVolume ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
              className="absolute bottom-2.5 right-2.5 rounded-[24px] bg-[#404040] text-white text-[11px] sm:text-[12px] font-bold px-[5px] py-[1px]"
            >
              {weightVolume.value}{weightVolume.unit}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Out of stock */}
        <AnimatePresence>
          {!product.inStock ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
              className="absolute top-2.5 left-2.5 rounded-full bg-black/70 text-white text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 backdrop-blur-sm"
            >
              Нет в наличии
            </motion.div>
          ) : null}
        </AnimatePresence>

      </div>

      {/* Content (Samokat-like typography) */}
      <div className="px-0 pb-0 pt-0 flex flex-col gap-0 flex-1">
        {/* Name */}
        <h3 className="text-[13px] sm:text-[14px] font-medium text-gray-800 leading-snug m-0 pt-[6px] line-clamp-2" title={product.name}>
          {product.name}
        </h3>

        {/* Secondary line (Samokat-like): category or short description */}
        <p className="text-[12px] text-gray-500 leading-normal m-0 line-clamp-1">
          {product.description ? product.description : product.category}
        </p>

        {/* Footer: price pill + plus (Samokat promo) */}
        <div className="flex items-center justify-between gap-2.5 mt-[6px]">
          <div className="rounded-[40px] bg-[#ffebef] pl-3 pr-8 py-[7px] h-[36px] flex items-center">
            {hasDiscount && priceUi?.hasDiscount ? (
              <div className="flex flex-col leading-none">
                <span className="text-[11px] text-gray-500 line-through mr-1">{priceUi.original}</span>
                <span className="text-[15px] font-bold text-gray-800">{priceUi.final}</span>
              </div>
            ) : (
              <span className="text-[15px] font-bold text-gray-800">{formatPriceWithCurrency(price)}</span>
            )}
          </div>

          {/* Mobile: Samokat-like + button / qty controls */}
          <div
            className="lg:hidden"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {cartQuantity > 0 ? (
                <motion.div
                  key="quantity-controls-mobile"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <QuantityControls
                    quantity={cartQuantity}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    size="sm"
                    variant="modern"
                    className="shadow-sm bg-white/90 backdrop-blur-md"
                    max={99}
                  />
                </motion.div>
              ) : (
                <motion.button
                  key="add-button-mobile"
                  type="button"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500 text-white border-none cursor-pointer shadow-sm transition-all flex-shrink-0 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  aria-label={`Добавить ${product.name} в корзину`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop: keep existing premium controls */}
          <div className="hidden lg:block">
            <AnimatePresence mode="wait">
              {cartQuantity > 0 ? (
                <motion.div
                  key="quantity-controls"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <QuantityControls
                    quantity={cartQuantity}
                    onIncrement={handleIncrement}
                    onDecrement={handleDecrement}
                    size="md"
                    variant="premium"
                    max={99}
                  />
                </motion.div>
              ) : (
                <motion.button
                  key="add-button"
                  type="button"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-pink-500 text-white border-none cursor-pointer shadow-md transition-all flex-shrink-0 hover:bg-pink-600 hover:shadow-lg active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  aria-label={`Добавить ${product.name} в корзину`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Убираем memo полностью - он блокирует обновления
// Компонент должен обновляться при любых изменениях пропсов
export default ProductCardPremium;

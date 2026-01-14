/**
 * Хук для управления загрузкой изображения товара
 * Обрабатывает loading, error состояния и fallback на placeholder
 */
import { useState, useEffect, useMemo } from 'react';
import { getProductImage, PLACEHOLDER_IMAGE } from '../lib/product-images';
import type { Product } from '../types';

interface UseProductImageOptions {
  product: Product;
  onLoad?: () => void;
  onError?: () => void;
}

export function useProductImage({ product, onLoad, onError }: UseProductImageOptions) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');

  const productImage = useMemo(
    () => getProductImage(product),
    [product.image, product.category]
  );

  useEffect(() => {
    setCurrentImageSrc(productImage);
    setImageError(false);
    setImageLoaded(false);
  }, [productImage]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onLoad?.();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    
    if (img.src === PLACEHOLDER_IMAGE || img.src.startsWith('data:')) {
      return;
    }
    
    if (currentImageSrc !== PLACEHOLDER_IMAGE) {
      setImageError(true);
      setCurrentImageSrc(PLACEHOLDER_IMAGE);
      img.src = PLACEHOLDER_IMAGE;
      onError?.();
    }
  };

  return {
    imageSrc: currentImageSrc || productImage,
    imageLoaded,
    imageError,
    handleImageLoad,
    handleImageError,
  };
}

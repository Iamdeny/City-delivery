'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { formatPriceWithCurrency } from '@/lib/format';
import { getPlaceholderByCategory } from '@/lib/placeholders';
import { isValidImageUrl } from '@/lib/utils';
import type { Product } from '@/types';

interface RecommendationProductProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  trackEvent: (eventType: 'impression' | 'click', productId: number) => void;
}

const RecommendationProduct: React.FC<RecommendationProductProps> = ({
  product,
  onAddToCart,
  trackEvent,
}) => {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      trackEvent('impression', product.id);
    }
  }, [inView, product.id, trackEvent]);

  const imageSrc =
    product.image &&
    (product.image.startsWith('data:') || isValidImageUrl(product.image))
      ? product.image
      : getPlaceholderByCategory(product.category ?? 'Прочее');
  const isDataUri = imageSrc.startsWith('data:');

  return (
    <button
      ref={ref}
      type='button'
      className='flex-shrink-0 w-[120px] rounded-2xl overflow-hidden bg-white border border-[#eee] text-left active:scale-[0.98] transition-transform'
      onClick={() => {
        trackEvent('click', product.id);
        onAddToCart?.(product);
      }}
    >
      <div className='relative w-full h-20 rounded-t-2xl bg-[#f0f2f5] overflow-hidden'>
        {isDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={product.name}
            className='w-full h-full object-cover'
          />
        ) : (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes='120px'
            className='object-cover'
          />
        )}
      </div>
      <div className='p-2.5'>
        <div className='text-[15px] font-bold text-[#1a1a1a]'>
          {formatPriceWithCurrency(Number(product.price) || 0)}
        </div>
        <div
          className='text-[13px] font-normal text-[#1a1a1a] truncate mt-0.5'
          title={product.name}
        >
          {product.name}
        </div>
        <div className='mt-2 flex items-center justify-center gap-1 rounded-xl bg-[#e0f2ff] py-2 text-[13px] font-semibold text-[#2563eb]'>
          + Добавить
        </div>
      </div>
    </button>
  );
};

export default RecommendationProduct;

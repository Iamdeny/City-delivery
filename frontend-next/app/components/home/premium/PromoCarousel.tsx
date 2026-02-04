/**
 * PromoCarousel — Premium 2026
 * Горизонтальный скролл баннеров. Соотношение сторон 16:9.
 * Текст внутри баннера с Kinetic Typography (плавная анимация).
 */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  bgColor: string;
  href?: string;
}

const defaultBanners: Banner[] = [
  {
    id: '1',
    title: 'Промокод на первый заказ',
    subtitle: 'Скидка 20% и бесплатная доставка',
    badge: 'NEW20',
    bgColor: 'linear-gradient(135deg, #e8f5e9 0%, #f3e8ff 100%)',
    href: '/products',
  },
  {
    id: '2',
    title: 'Неприлично выгодно',
    subtitle: 'Товары по низким ценам',
    badge: '-30%',
    bgColor: 'linear-gradient(135deg, #ffedf2 0%, #fff2e5 100%)',
    href: '/products',
  },
  {
    id: '3',
    title: 'Доставка за 15 минут',
    subtitle: 'Свежие продукты к вашей двери',
    bgColor: 'linear-gradient(135deg, #e3f2fd 0%, #e8f5e9 100%)',
    href: '/products',
  },
];

interface PromoCarouselProps {
  banners?: Banner[];
  className?: string;
}

export default function PromoCarousel({ banners = defaultBanners, className = '' }: PromoCarouselProps) {
  return (
    <section className={`mb-8 ${className}`} aria-label="Промо-баннеры">
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{ paddingLeft: 'var(--premium-margin-mobile)', paddingRight: 'var(--premium-margin-mobile)' }}
      >
        {banners.map((banner, i) => (
          <Link
            key={banner.id}
            href={banner.href ?? '/products'}
            className="flex-shrink-0 w-[85vw] max-w-[320px] snap-start rounded-[var(--premium-radius-card)] overflow-hidden shadow-sm active:scale-[0.98] transition-transform"
            style={{ aspectRatio: '16/9' }}
          >
            <div
              className="relative w-full h-full flex flex-col justify-center p-4"
              style={{ background: banner.bgColor }}
            >
              {banner.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-bold text-[var(--premium-text)]">
                  {banner.badge}
                </span>
              )}
              <motion.h3
                className="text-[18px] font-bold text-[var(--premium-text)] leading-tight mb-1"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                {banner.title}
              </motion.h3>
              {banner.subtitle && (
                <motion.p
                  className="text-[13px] text-[var(--premium-text-secondary)]"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 + 0.1 }}
                >
                  {banner.subtitle}
                </motion.p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

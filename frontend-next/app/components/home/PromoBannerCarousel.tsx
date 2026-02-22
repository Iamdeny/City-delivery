/**
 * Горизонтальный карусель промо-баннеров в стиле Самоката
 */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface PromoBanner {
  id: number;
  title: string;
  image?: string;
  link: string;
  badge?: string;
}

const mockBanners: PromoBanner[] = [
  {
    id: 1,
    title: 'Что попробовать новенького',
    link: '/products',
  },
  {
    id: 2,
    title: 'Варим ароматный кофе',
    link: '/products',
  },
  {
    id: 3,
    title: 'Блюда от шефа Емельяненко и розыгрыш!',
    link: '/products',
  },
  {
    id: 4,
    title: 'Привезём заказ и в снег, и в стужу',
    link: '/products',
  },
  {
    id: 5,
    title: '4 секрета подачи и сервировки',
    link: '/recipes',
  },
];

export default function PromoBannerCarousel() {
  return (
    <div className="mb-6 px-4 lg:px-0">
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide snap-x snap-mandatory">
        {mockBanners.map((banner, idx) => (
          <Link
            key={banner.id}
            href={banner.link}
            className="flex-shrink-0 w-[calc(100vw-32px)] sm:w-[400px] rounded-[18px] overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] snap-start"
          >
            <motion.div
              className="relative aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {banner.image ? (
                <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 text-sm text-center px-4 font-medium">{banner.title}</div>
              )}
              {banner.badge && (
                <span className="absolute top-3 left-3 text-[10px] font-extrabold text-white bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
                  {banner.badge}
                </span>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent p-4">
                <h3 className="text-white font-extrabold text-base leading-tight drop-shadow-lg">{banner.title}</h3>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

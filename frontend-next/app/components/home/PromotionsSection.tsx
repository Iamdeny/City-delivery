/**
 * Секция акций в стиле Самоката
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Promotion {
  id: number;
  title: string;
  badge?: string;
  backgroundColor: string;
  backgroundImage?: string; // Путь к изображению фона
  products?: Array<{ name: string; image?: string }>;
}

const mockPromotions: Promotion[] = [
  {
    id: 1,
    title: 'Неприлично выгодно',
    badge: 'сберфест',
    backgroundColor: 'bg-[#ffebef]',
    backgroundImage: '/images/promotions/sberfest.jpg', // Изображение с Самоката
    products: [{ name: 'Bounty', image: '/images/promotions/bounty.jpg' }, { name: 'Lambert', image: '/images/promotions/lambert.jpg' }],
  },
  {
    id: 2,
    title: 'Тут товары по низким ценам',
    badge: 'цены ниже',
    backgroundColor: 'bg-[#ffebef]',
    backgroundImage: '/images/promotions/low-prices.jpg',
    products: [{ name: 'Flamenco', image: '/images/promotions/flamenco.jpg' }],
  },
  {
    id: 3,
    title: '-30% на сегодня',
    badge: '-30%',
    backgroundColor: 'bg-[#e8f5e9]',
    backgroundImage: '/images/promotions/discount-30.jpg',
  },
];

export default function PromotionsSection() {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 lg:px-0">
        <h2 className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight">Акции</h2>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-600 hover:text-green-700 transition-colors active:scale-[0.99]"
        >
          Все акции &gt;
        </Link>
      </div>

      <div className="px-4 lg:px-0">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide snap-x snap-mandatory">
          {mockPromotions.map((promo) => (
            <Link
              key={promo.id}
              href="/products"
              className="flex-shrink-0 w-[280px] rounded-[18px] p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] snap-start relative overflow-hidden"
              style={{ backgroundColor: promo.backgroundColor === 'bg-[#ffebef]' ? '#ffebef' : '#e8f5e9' }}
            >
              {/* Фоновое изображение, если есть */}
              {promo.backgroundImage && (
                <div className="absolute inset-0 opacity-10 z-0">
                  <Image
                    src={promo.backgroundImage}
                    alt={promo.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="flex items-start justify-between mb-2 relative z-10">
                <h3 className="text-[15px] font-semibold text-[#1a1a1a] flex-1 pr-2 leading-tight">{promo.title}</h3>
                {promo.badge && (
                  <span className="text-[10px] font-extrabold text-[#1a1a1a] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                    {promo.badge}
                  </span>
                )}
              </div>
              {promo.products && promo.products.length > 0 && (
                <div className="flex gap-2 mt-3 relative z-10">
                  {promo.products.map((product, idx) => (
                    <div
                      key={idx}
                      className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-xs font-semibold text-gray-600 shadow-sm overflow-hidden relative"
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <span>{product.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

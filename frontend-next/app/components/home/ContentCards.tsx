/**
 * Большие информационные карточки в стиле Самоката
 */
'use client';

import Link from 'next/link';

interface CollectionCard {
  title: string;
  subtitle: string;
  link?: string;
}

// Подборки как на экране "Home Delivery" в Banani
const collections: CollectionCard[] = [
  {
    title: 'Готово к ужину',
    subtitle: 'Быстрые блюда за 15 минут',
    link: '/products?tag=dinner',
  },
  {
    title: 'Фрукты и ягоды',
    subtitle: 'Спелые и свежие',
    link: '/products?category=Фрукты%20и%20ягоды',
  },
  {
    title: 'Завтрак',
    subtitle: 'Круассаны, хлопья, йогурт',
    link: '/products?tag=breakfast',
  },
  {
    title: 'Без сахара',
    subtitle: 'Полезные сладости',
    link: '/products?tag=no-sugar',
  },
];

export default function ContentCards() {
  return (
    <section className="px-4 lg:px-0 mb-4">
      <h2 className="text-[18px] font-extrabold text-[#1a1a1a] mb-3">
        Подборки от Самоката
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-1.5 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide snap-x snap-mandatory">
        {collections.map((card, idx) => (
          <Link
            key={idx}
            href={card.link || '#'}
            className="flex-shrink-0 w-[220px] rounded-[18px] bg-white overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98] snap-start"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-[#f5f5f5] via-[#f0f0ff] to-[#ffeef5] flex items-center justify-center px-3">
              <div className="text-[13px] font-semibold text-[#1a1a1a] leading-snug">
                {card.title}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-[15px] font-extrabold text-[#1a1a1a] leading-tight line-clamp-2">
                {card.title}
              </h3>
              <p className="mt-0.5 text-[12px] text-gray-500 line-clamp-2">
                {card.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

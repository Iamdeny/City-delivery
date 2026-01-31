/**
 * Большие информационные карточки в стиле Самоката
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ContentCard {
  title: string;
  image?: string;
  link?: string;
}

const defaultCards: ContentCard[] = [
  {
    title: '4 секрета подачи и сервировки',
    link: '/recipes',
  },
  {
    title: 'Супы из разных стран',
    link: '/recipes',
  },
];

export default function ContentCards() {
  return (
    <div className="px-4 lg:px-0 mb-4">
      <div className="grid grid-cols-2 gap-3">
        {defaultCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.link || '#'}
            className="block bg-white rounded-[18px] overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              {card.image ? (
                <Image src={card.image} alt={card.title} width={200} height={150} className="object-cover w-full h-full" />
              ) : (
                <div className="text-gray-400 text-xs text-center px-2">{card.title}</div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-sm font-extrabold text-[#1a1a1a] line-clamp-2 leading-tight">{card.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

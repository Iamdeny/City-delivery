'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';

const FAQ_ITEMS = [
  { q: 'Когда привезут заказ?', href: '#' },
  { q: 'Деньги списали, а заказа нет', href: '#' },
  { q: 'Как отменить заказ?', href: '#' },
];

const FAQ_TOPICS = [
  { label: 'Доставка', href: '#' },
  { label: 'Оплата', href: '#' },
  { label: 'Товары', href: '#' },
  { label: 'Промокоды', href: '#' },
  { label: 'Профиль', href: '#' },
  { label: 'Работа', href: '#' },
];

export default function ProfileFaqPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Вопросы и ответы
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Найти ответ"
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#f5f5f5] border-0 text-[15px] text-[#1a1a1a] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4d6a]/30"
            />
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">
            Частые вопросы
          </h2>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item) => (
              <Link
                key={item.q}
                href={item.href}
                className="flex items-center justify-between py-2.5 text-[14px] text-[#1a1a1a] active:opacity-80"
              >
                {item.q}
                <span className="text-gray-400">›</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">
            По темам
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {FAQ_TOPICS.map((topic) => (
              <Link
                key={topic.label}
                href={topic.href}
                className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-[#f5f5f5] text-[14px] font-medium text-[#1a1a1a] active:opacity-80"
              >
                <span className="text-lg">📋</span>
                {topic.label}
              </Link>
            ))}
          </div>
        </section>

        <p className="text-[13px] text-[#5a5a5a] text-center">
          Не нашли ответ?{' '}
          <Link href="/profile/support" className="text-[#ff4d6a] font-semibold underline">
            Напишите нам в поддержку
          </Link>
        </p>
      </div>
    </div>
  );
}

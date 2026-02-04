'use client';

import Link from 'next/link';
import { MessageCircle, Phone } from 'lucide-react';

export default function ProfileSupportPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Связаться с нами
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="space-y-3">
            <Link
              href="#"
              className="flex items-center justify-between py-3 px-3 rounded-2xl bg-[#f5f5f5] active:opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e8f5e9] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#16a34a]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    Написать
                  </span>
                  <span className="text-[12px] text-[#5a5a5a]">
                    В чат поддержки
                  </span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400">›</span>
            </Link>

            <Link
              href="tel:+78001234567"
              className="flex items-center justify-between py-3 px-3 rounded-2xl bg-[#f5f5f5] active:opacity-80"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e3f2fd] flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#1976d2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    Позвонить
                  </span>
                  <span className="text-[12px] text-[#5a5a5a]">
                    Оператору
                  </span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400">›</span>
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">
            Мессенджеры
          </h2>
          <div className="flex gap-3">
            <a
              href="https://t.me/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#e8f5e9] text-[#1a1a1a] text-[14px] font-semibold active:scale-[0.98]"
            >
              <span aria-hidden>📱</span>
              Telegram
            </a>
            <a
              href="https://wa.me/78001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#e8f5e9] text-[#1a1a1a] text-[14px] font-semibold active:scale-[0.98]"
            >
              <span aria-hidden>💬</span>
              WhatsApp
            </a>
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-4 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">
            Частые вопросы
          </h2>
          <div className="space-y-1">
            <Link href="/profile/faq" className="flex items-center justify-between py-2.5 text-[14px] text-[#1a1a1a] active:opacity-80">
              Где мой заказ?
              <span className="text-gray-400">›</span>
            </Link>
            <Link href="/profile/faq" className="flex items-center justify-between py-2.5 text-[14px] text-[#1a1a1a] active:opacity-80">
              Проблема с товаром
              <span className="text-gray-400">›</span>
            </Link>
            <Link href="/profile/faq" className="flex items-center justify-between py-2.5 text-[14px] text-[#1a1a1a] active:opacity-80">
              Как вернуть деньги?
              <span className="text-gray-400">›</span>
            </Link>
            <Link href="/profile/faq" className="flex items-center justify-between py-2.5 text-[14px] text-[#1a1a1a] active:opacity-80">
              Изменить адрес доставки
              <span className="text-gray-400">›</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

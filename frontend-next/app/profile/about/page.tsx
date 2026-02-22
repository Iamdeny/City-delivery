'use client';

import Link from 'next/link';
import { ChevronRight, ExternalLink } from 'lucide-react';

export default function ProfileAboutPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 pt-[var(--safe-top)]">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          О приложении
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-2xl font-bold text-[#1a1a1a]">
              🛵
            </div>
            <div>
              <div className="text-[18px] font-extrabold text-[#1a1a1a]">
                City Delivery
              </div>
              <div className="text-[13px] text-[#5a5a5a]">
                Версия 1.0.0
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Link
              href="#"
              className="flex items-center justify-between py-2.5 text-[15px] font-medium text-[#1a1a1a] active:opacity-80"
            >
              Пользовательское соглашение
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="#"
              className="flex items-center justify-between py-2.5 text-[15px] font-medium text-[#1a1a1a] active:opacity-80"
            >
              Политика конфиденциальности
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              href="#"
              className="flex items-center justify-between py-2.5 text-[15px] font-medium text-[#1a1a1a] active:opacity-80"
            >
              Лицензионное соглашение
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between py-2.5 text-[15px] font-medium text-[#1a1a1a] active:opacity-80"
            >
              Оценить приложение
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </a>
          </div>
        </section>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex justify-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-lg" aria-label="Соцсеть">
              📘
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-lg" aria-label="Соцсеть">
              📷
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-lg" aria-label="Соцсеть">
              🐦
            </a>
          </div>
        </section>

        <p className="text-[12px] text-[#5a5a5a] text-center">
          © {new Date().getFullYear()} City Delivery. Все права защищены.
        </p>
      </div>
    </div>
  );
}

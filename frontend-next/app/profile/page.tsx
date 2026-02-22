'use client';

import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login?next=/profile');
  };

  const goTo = (path: string) => () => {
    router.push(path);
  };

  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 pt-[var(--safe-top)]">
      <div className="max-w-xl mx-auto px-4 pt-5">
        {/* Заголовок экрана */}
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Профиль
        </h1>

        {/* Карточка профиля как в Banani */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#ffe5ec] flex items-center justify-center text-xl font-semibold text-[#ff4d6a]">
              А
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-[#1a1a1a] leading-tight">
                Алексей
              </div>
              <div className="text-[13px] text-[#5a5a5a]">
                +7 912 345-67-89
              </div>
            </div>
          </div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1">
            <span className="text-[12px] font-semibold text-[#1a1a1a]">
              СберПрайм
            </span>
            <span className="text-[11px] text-[#16a34a] font-semibold">
              Подписка активна
            </span>
          </div>
        </section>

        {/* Блоки навигации профиля */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <button
            type="button"
            onClick={goTo('/profile/orders')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-lg">
                🧾
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1a1a1a]">
                  Заказы
                </span>
              </div>
            </div>
            <span className="text-[18px] text-gray-400">›</span>
          </button>

          <button
            type="button"
            onClick={goTo('/profile/addresses')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-lg">
                📍
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1a1a1a]">
                  Адреса
                </span>
              </div>
            </div>
            <span className="text-[18px] text-gray-400">›</span>
          </button>

          <button
            type="button"
            onClick={goTo('/profile/payments')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-lg">
                💳
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1a1a1a]">
                  Карты
                </span>
              </div>
            </div>
            <span className="text-[18px] text-gray-400">›</span>
          </button>

          <button
            type="button"
            onClick={goTo('/profile/favorites')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-lg">
                ⭐
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1a1a1a]">
                  Любимое
                </span>
              </div>
            </div>
            <span className="text-[18px] text-gray-400">›</span>
          </button>
        </section>

        {/* Помощь / о приложении */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <button
            type="button"
            onClick={goTo('/profile/support')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <span className="text-[15px] font-semibold text-[#1a1a1a]">
              Помощь
            </span>
            <span className="text-[18px] text-gray-400">›</span>
          </button>
          <button
            type="button"
            onClick={goTo('/profile/faq')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <span className="text-[15px] font-semibold text-[#1a1a1a]">
              Вопросы и ответы
            </span>
            <span className="text-[18px] text-gray-400">›</span>
          </button>
          <button
            type="button"
            onClick={goTo('/profile/about')}
            className="w-full flex items-center justify-between py-2 active:opacity-80"
          >
            <span className="text-[15px] font-semibold text-[#1a1a1a]">
              О приложении
            </span>
            <span className="text-[18px] text-gray-400">›</span>
          </button>
        </section>

        <button
          type="button"
          onClick={handleLoginClick}
          className="w-full mt-2 py-3 rounded-[18px] border border-gray-300 text-[15px] font-semibold text-[#1a1a1a] bg-white active:scale-[0.98] transition-transform"
        >
          Войти или зарегистрироваться
        </button>
      </div>
    </div>
  );
}


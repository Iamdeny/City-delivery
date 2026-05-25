'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Читаем данные пользователя из localStorage при загрузке страницы
    const savedUser = localStorage.getItem('delivery_app_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Ошибка парсинга данных пользователя:', e);
      }
    }
  }, []);

  const handleLoginClick = () => {
    router.push('/login?next=/profile');
  };

  const handleLogoutClick = () => {
    // Очищаем ключи авторизации приложения
    localStorage.removeItem('delivery_app_access_token');
    localStorage.removeItem('delivery_app_refresh_token');
    localStorage.removeItem('delivery_app_user');
    setUser(null);
    // Принудительно перезагружаем страницу, чтобы сбросить сокеты и контексты
    window.location.reload();
  };

  const goTo = (path: string) => () => {
    router.push(path);
  };

  // Получаем первую букву имени для аватарки
  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'Г';

  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 pt-[var(--safe-top)]">
      <div className="max-w-xl mx-auto px-4 pt-5">
        {/* Заголовок экрана */}
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Профиль
        </h1>

        {/* Карточка профиля */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#ffe5ec] flex items-center justify-center text-xl font-semibold text-[#ff4d6a]">
              {firstLetter}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-extrabold text-[#1a1a1a] leading-tight truncate">
                {user?.name || 'Гость'}
              </div>
              <div className="text-[13px] text-[#5a5a5a] truncate">
                {user?.email || 'Авторизуйтесь для заказа'}
              </div>
            </div>
          </div>
          {user && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#f5f5f5] px-3 py-1">
              <span className="text-[12px] font-semibold text-[#1a1a1a]">
                СберПрайм
              </span>
              <span className="text-[11px] text-[#16a34a] font-semibold">
                Подписка активна
              </span>
            </div>
          )}
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

        {/* Переключаем кнопку входа/выхода в зависимости от статуса авторизации */}
        {!user ? (
          <button
            type="button"
            onClick={handleLoginClick}
            className="w-full mt-2 py-3 rounded-[18px] border border-gray-300 text-[15px] font-semibold text-[#1a1a1a] bg-white active:scale-[0.98] transition-transform"
          >
            Войти или зарегистрироваться
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogoutClick}
            className="w-full mt-2 py-3 rounded-[18px] border border-red-200 text-[15px] font-semibold text-red-600 bg-red-50 active:scale-[0.98] transition-transform"
          >
            Выйти из аккаунта
          </button>
        )}
      </div>
    </div>
  );
}

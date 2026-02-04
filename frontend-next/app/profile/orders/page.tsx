'use client';

export default function ProfileOrdersPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        {/* Заголовок и табы */}
        <header className="mb-4">
          <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-2">
            Заказы
          </h1>
          <div className="inline-flex rounded-full bg-[#f2f2f2] p-1 text-[13px] font-semibold">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-white text-[#1a1a1a]"
            >
              Активные
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full text-gray-500"
            >
              История
            </button>
          </div>
        </header>

        {/* Активный заказ */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[13px] text-[#5a5a5a]">Заказ из Лавки</span>
              <span className="text-[13px] text-[#1a1a1a]">
                Собираем • Доставим к 19:45
              </span>
            </div>
            <span className="text-[15px] font-extrabold text-[#1a1a1a]">
              890 ₽
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="ml-1 px-2 py-1 rounded-full bg-[#f5f5f5] text-[11px] font-semibold text-[#1a1a1a]">
              +4
            </div>
          </div>
        </section>

        {/* История заказов */}
        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[13px] text-[#5a5a5a]">
                22 октября, 14:30
              </span>
              <span className="text-[13px] text-[#16a34a] font-semibold">
                Доставлен
              </span>
            </div>
            <span className="text-[15px] font-extrabold text-[#1a1a1a]">
              1 240 ₽
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
          </div>
          <button
            type="button"
            className="w-full py-2.5 rounded-[16px] bg-[#f5f5f5] text-[13px] font-semibold text-[#1a1a1a] active:scale-[0.98] transition-transform"
          >
            Повторить заказ
          </button>
        </section>

        <section className="bg-white rounded-[24px] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-[13px] text-[#5a5a5a]">
                18 октября, 09:15
              </span>
              <span className="text-[13px] text-[#16a34a] font-semibold">
                Доставлен
              </span>
            </div>
            <span className="text-[15px] font-extrabold text-[#1a1a1a]">
              450 ₽
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
            <div className="w-8 h-8 rounded-xl bg-[#f5f5f5]" />
          </div>
          <button
            type="button"
            className="w-full py-2.5 rounded-[16px] bg-[#f5f5f5] text-[13px] font-semibold text-[#1a1a1a] active:scale-[0.98] transition-transform"
          >
            Повторить заказ
          </button>
        </section>
      </div>
    </div>
  );
}


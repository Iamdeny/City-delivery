'use client';

export default function ProfileFavoritesPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 pt-[var(--safe-top)]">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Любимое
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-[#1a1a1a]">
              Любимое
            </h2>
          </div>
          <div className="flex items-center gap-2 mb-2 text-[12px] text-[#5a5a5a]">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-[12px] font-semibold"
            >
              Все
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[#1a1a1a] text-[12px] font-semibold"
            >
              Молочное
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[#1a1a1a] text-[12px] font-semibold"
            >
              Хлеб
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[#1a1a1a] text-[12px] font-semibold"
            >
              Сладости
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-[#f5f5f5] p-2 flex flex-col">
              <div className="h-20 rounded-[14px] bg-gray-200 mb-2" />
              <div className="text-[13px] font-semibold text-[#1a1a1a] leading-snug line-clamp-2">
                Круассан миндальный, Самокат
              </div>
              <div className="mt-1 text-[12px] text-[#5a5a5a]">90 г</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[13px] font-extrabold text-[#1a1a1a]">
                  119 ₽
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-[11px] font-semibold"
                >
                  Добавить
                </button>
              </div>
            </div>

            <div className="rounded-[18px] bg-[#f5f5f5] p-2 flex flex-col">
              <div className="h-20 rounded-[14px] bg-gray-200 mb-2" />
              <div className="text-[13px] font-semibold text-[#1a1a1a] leading-snug line-clamp-2">
                Молоко пастеризованное 3.2%
              </div>
              <div className="mt-1 text-[12px] text-[#5a5a5a]">930 мл</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-[13px] font-extrabold text-[#1a1a1a]">
                    89 ₽
                  </span>
                  <span className="text-[11px] text-[#9ca3af] line-through">
                    105 ₽
                  </span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-[#1a1a1a] text-white text-[11px] font-semibold"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


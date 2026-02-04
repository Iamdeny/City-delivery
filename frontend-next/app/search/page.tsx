'use client';

export default function SearchScreenPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-white pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        {/* Верхняя панель с полем поиска и кнопкой Отмена */}
        <header className="mb-4 flex items-center gap-3">
          <div className="flex-1 h-11 rounded-[18px] bg-[#f5f5f5] flex items-center px-3 gap-2">
            <div className="w-4 h-4 rounded-full border border-gray-500" />
            <input
              type="text"
              placeholder="Искать в Самокате"
              className="flex-1 bg-transparent border-0 outline-none text-[14px] text-[#1a1a1a] placeholder:text-gray-500"
            />
          </div>
          <button
            type="button"
            className="text-[14px] font-semibold text-[#1a1a1a]"
          >
            Отмена
          </button>
        </header>

        {/* Вы искали */}
        <section className="mb-4">
          <div className="text-[13px] text-[#5a5a5a] mb-2">Вы искали</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[13px] text-[#1a1a1a]"
            >
              Молоко 3.2%
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[13px] text-[#1a1a1a]"
            >
              Хлеб бородинский
            </button>
          </div>
        </section>

        {/* Часто ищут */}
        <section className="mb-4">
          <div className="text-[13px] text-[#5a5a5a] mb-2">Часто ищут</div>
          <div className="flex flex-wrap gap-2">
            {['Яйца', 'Бананы', 'Вода', 'Мороженое', 'Сыры', 'Кофе'].map(
              (label) => (
                <button
                  key={label}
                  type="button"
                  className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[13px] text-[#1a1a1a]"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </section>

        {/* Категории */}
        <section className="mb-2">
          <div className="text-[13px] text-[#5a5a5a] mb-2">Категории</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[18px] bg-[#f5f5f5] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">
                  Готовая еда
                </span>
              </div>
            </div>

            <div className="rounded-[18px] bg-[#f5f5f5] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">
                  Молочное
                </span>
              </div>
            </div>

            <div className="rounded-[18px] bg-[#f5f5f5] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">
                  Овощи и зелень
                </span>
              </div>
            </div>

            <div className="rounded-[18px] bg-[#f5f5f5] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-200" />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">
                  Сладости
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


'use client';

export default function ProfileAddressesPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20 pt-[var(--safe-top)]">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Адреса
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-lg">
                📍
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold text-[#1a1a1a]">
                  Добавить адрес
                </span>
              </div>
            </div>
            <span className="text-[18px] text-gray-400">+</span>
          </div>

          <div className="mt-2 text-[13px] text-[#5a5a5a]">
            Сохранённые
          </div>

          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-sm">
                  Дом
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    Дом
                  </span>
                  <span className="text-[13px] text-[#5a5a5a]">
                    Невский проспект, 14, кв. 45
                  </span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400">›</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-sm">
                  Работа
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    Работа
                  </span>
                  <span className="text-[13px] text-[#5a5a5a]">
                    БЦ «Сенатор», ул. Правды, 8
                  </span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400">›</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-2xl bg-[#f5f5f5] flex items-center justify-center text-sm">
                  Родители
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-[#1a1a1a]">
                    Родители
                  </span>
                  <span className="text-[13px] text-[#5a5a5a]">
                    Садовая улица, 32
                  </span>
                </div>
              </div>
              <span className="text-[18px] text-gray-400">›</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


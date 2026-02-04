'use client';

export default function ProfilePaymentsPage() {
  return (
    <div className="min-h-[var(--app-height,100vh)] bg-[#f5f5f5] pb-20">
      <div className="max-w-xl mx-auto px-4 pt-5">
        <h1 className="text-[22px] font-extrabold text-[#1a1a1a] mb-4">
          Способы оплаты
        </h1>

        <section className="bg-white rounded-[24px] p-4 mb-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-2">
              Мои карты
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#f5f5f5]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-6 rounded-md bg-[#004c3f]" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">
                      Mir •••• 4582
                    </span>
                    <span className="text-[11px] text-[#5a5a5a]">05/28</span>
                  </div>
                </div>
                <span className="text-[11px] text-[#16a34a] font-semibold">
                  По умолчанию
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#f5f5f5]">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-6 rounded-md bg-[#ff6b00]" />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">
                      Mastercard •••• 9211
                    </span>
                    <span className="text-[11px] text-[#5a5a5a]">12/26</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-2">
              Другие способы
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#f5f5f5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00c853] flex items-center justify-center text-[11px] font-bold text-white">
                    S
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-[#1a1a1a]">
                      SBER
                    </span>
                    <span className="text-[11px] text-[#5a5a5a]">
                      SberPay • Быстрая оплата
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full py-3 rounded-[18px] bg-[#f5f5f5] text-[14px] font-semibold text-[#1a1a1a] active:scale-[0.98] transition-transform"
          >
            Добавить новую карту
          </button>

          <p className="mt-3 text-[11px] text-[#5a5a5a] leading-snug">
            Данные карт надежно защищены по стандарту PCI DSS. Мы не храним CVC
            коды.
          </p>
        </section>
      </div>
    </div>
  );
}


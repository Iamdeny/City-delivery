'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOpsSession } from '../_lib/opsSession';

type StorePayload = {
  name: string;
  address: string;
  is_active: boolean;
  phone?: string | null;
  email?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  delivery_radius?: number | null;
  delivery_fee?: number | null;
  min_order_amount?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

function numOrNull(v: string) {
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: string) {
  const n = numOrNull(v);
  return n === null ? null : Math.floor(n);
}

async function createStore(payload: StorePayload) {
  const res = await fetch(`/api/bff/admin/dark-stores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) throw { httpStatus: res.status, data };
  return data as { success: boolean; store: { id: number } };
}

function formatErr(e: unknown) {
  const anyErr = e as { httpStatus?: number; data?: any };
  const details = anyErr?.data?.details;
  if (Array.isArray(details) && details.length) {
    const msg = details
      .slice(0, 4)
      .map((d: any) => `${d.field || 'field'}: ${d.message || 'invalid'}`)
      .join('; ');
    return `Ошибка валидации: ${msg}`;
  }
  const msg = anyErr?.data?.message || anyErr?.data?.error;
  if (typeof msg === 'string' && msg.trim()) return msg;
  if (anyErr?.httpStatus) return `HTTP ${anyErr.httpStatus}`;
  return 'Не удалось создать склад';
}

export function WarehousesActionsClient() {
  const router = useRouter();
  const { user } = useOpsSession();
  const role = user?.role ?? null;
  const can = role === 'admin' || role === 'manager';

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [deliveryRadius, setDeliveryRadius] = useState('5000');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [minOrder, setMinOrder] = useState('0');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const reset = () => {
    setName('');
    setAddress('');
    setIsActive(true);
    setOpeningTime('08:00');
    setClosingTime('22:00');
    setDeliveryRadius('5000');
    setDeliveryFee('0');
    setMinOrder('0');
    setLatitude('');
    setLongitude('');
    setPhone('');
    setEmail('');
    setError(null);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: StorePayload = {
        name: name.trim(),
        address: address.trim(),
        is_active: isActive,
        opening_time: openingTime.trim() ? openingTime.trim() : null,
        closing_time: closingTime.trim() ? closingTime.trim() : null,
        delivery_radius: intOrNull(deliveryRadius),
        delivery_fee: numOrNull(deliveryFee),
        min_order_amount: numOrNull(minOrder),
        latitude: numOrNull(latitude),
        longitude: numOrNull(longitude),
        phone: phone.trim() ? phone.trim() : null,
        email: email.trim() ? email.trim() : null,
      };
      let res: any;
      res = await createStore(payload);

      const id = res?.store?.id;
      setOpen(false);
      reset();
      if (id) router.push(`/ops/warehouses/${id}`);
      else router.refresh();
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  if (!can) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white"
        onClick={() => setOpen(true)}
      >
        + Создать склад
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">Новый склад</div>
              <button
                className="text-sm font-bold text-gray-600 hover:text-gray-900"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                disabled={loading}
              >
                Закрыть
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs font-semibold text-gray-600">Название</div>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    placeholder="Напр. Dark Store Центр"
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-600">Адрес</div>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    placeholder="Город, улица, дом"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Часы (открытие)</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      disabled={loading}
                      placeholder="08:00"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Часы (закрытие)</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      disabled={loading}
                      placeholder="22:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Радиус (м)</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={deliveryRadius}
                      onChange={(e) => setDeliveryRadius(e.target.value)}
                      disabled={loading}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Доставка (₽)</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      disabled={loading}
                      inputMode="decimal"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Мин. заказ (₽)</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={minOrder}
                      onChange={(e) => setMinOrder(e.target.value)}
                      disabled={loading}
                      inputMode="decimal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Latitude</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      disabled={loading}
                      inputMode="decimal"
                      placeholder="55.7558"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Longitude</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      disabled={loading}
                      inputMode="decimal"
                      placeholder="37.6173"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Телефон</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Email</div>
                    <input
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    disabled={loading}
                  />
                  Активен
                </label>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gray-900 disabled:opacity-50"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  disabled={loading}
                >
                  Отмена
                </button>
                <button
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
                  onClick={() => void submit()}
                  disabled={loading || !name.trim() || !address.trim()}
                >
                  {loading ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


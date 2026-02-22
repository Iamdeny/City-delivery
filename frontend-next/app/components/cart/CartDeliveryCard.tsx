/**
 * Samokat-style card above cart items: delivery/address/store/ETA.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Store, Timer, ChevronRight, X, RefreshCw } from 'lucide-react';

type DarkStore = { id: number; name: string };

type NearestResponse =
  | {
      success: true;
      store?: { id: number; name?: string | null; distance_km?: number | null } | null;
      estimatedDeliveryTime?: number | null;
      selected?: { darkStoreId?: number | null } | null;
    }
  | { success: false; error?: string; message?: string };

export type CartDeliveryStatus = {
  ok: boolean | null; // null = not checked / missing coords
  message?: string | null;
};

export interface CartDeliveryCardProps {
  onChange?: () => void;
  pickerOpen?: boolean;
  onPickerOpenChange?: (open: boolean) => void;
  onDeliveryStatusChange?: (status: CartDeliveryStatus) => void;
  hideWhenOk?: boolean; // Скрывать карточку, когда доставка доступна (адрес уже в заголовке)
}

export function CartDeliveryCard({
  onChange,
  pickerOpen,
  onPickerOpenChange,
  onDeliveryStatusChange,
  hideWhenOk = false,
}: CartDeliveryCardProps) {
  const [address, setAddress] = useState<string>('');
  const [storeId, setStoreId] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [storeName, setStoreName] = useState<string | null>(null);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [nearestStoreName, setNearestStoreName] = useState<string | null>(null);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryWarning, setDeliveryWarning] = useState<string | null>(null);
  const [suggestedStore, setSuggestedStore] = useState<{ id: number; name?: string | null } | null>(null);
  const [deliveryStatus, setDeliveryStatusLocal] = useState<CartDeliveryStatus>({ ok: null, message: null });

  // Picker modal state (Samokat-like)
  const [openInner, setOpenInner] = useState(false);
  const open = pickerOpen ?? openInner;
  const setOpen = onPickerOpenChange ?? setOpenInner;
  const [storesLoading, setStoresLoading] = useState(false);
  const [stores, setStores] = useState<DarkStore[]>([]);
  const [storesError, setStoresError] = useState<string | null>(null);

  const [nearestLoading, setNearestLoading] = useState(false);
  const [geoQ, setGeoQ] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoResults, setGeoResults] = useState<Array<{ id: number; label: string; lat: number; lng: number }>>([]);

  useEffect(() => {
    try {
      const a = localStorage.getItem('cd_address') || '';
      setAddress(a);
      setGeoQ(a);

      const sid = Number(localStorage.getItem('cd_dark_store_id') || 0);
      setStoreId(Number.isFinite(sid) && sid > 0 ? Math.floor(sid) : null);

      const lat = Number(localStorage.getItem('cd_geo_lat') || '');
      const lng = Number(localStorage.getItem('cd_geo_lng') || '');
      if (Number.isFinite(lat) && Number.isFinite(lng)) setCoords({ lat, lng });
    } catch {
      // ignore
    }
  }, []);

  // Resolve store name from selected store id.
  useEffect(() => {
    if (!storeId) return;
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch('/api/dark-stores?includeInactive=false', { cache: 'no-store', signal: ac.signal });
        const data = await res.json();
        const list = Array.isArray(data?.stores) ? (data.stores as DarkStore[]) : [];
        const s = list.find((x) => Number(x.id) === Number(storeId));
        setStoreName(s?.name || null);
      } catch {
        // ignore
      }
    })();
    return () => ac.abort();
  }, [storeId]);

  // Resolve ETA + nearest store name from stable coords (address-geocode flow).
  useEffect(() => {
    if (!coords) {
      setEtaMin(null);
      setNearestStoreName(null);
      setDeliveryError(null);
      setDeliveryWarning(null);
      setSuggestedStore(null);
      const status = { ok: null, message: null };
      setDeliveryStatusLocal(status);
      onDeliveryStatusChange?.(status);
      return;
    }
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await fetch(
          `/api/dark-stores/nearest?lat=${encodeURIComponent(coords.lat)}&lng=${encodeURIComponent(coords.lng)}`,
          { cache: 'no-store', signal: ac.signal }
        );
        const data = (await res.json()) as NearestResponse;
        if (!res.ok || !data || (data as any).success !== true) {
          const msg = String((data as any)?.message || (data as any)?.error || 'Доставка недоступна');
          setEtaMin(null);
          setNearestStoreName(null);
          setSuggestedStore(null);
          setDeliveryWarning(null);
          setDeliveryError(msg);
          const status = { ok: false, message: msg };
          setDeliveryStatusLocal(status);
          onDeliveryStatusChange?.(status);
          return;
        }

        const eta = Number((data as any)?.estimatedDeliveryTime ?? null);
        setEtaMin(Number.isFinite(eta) && eta > 0 ? Math.round(eta) : null);

        const deliverableId = Number((data as any)?.selected?.darkStoreId ?? (data as any)?.store?.id ?? 0);
        const deliverableName = String((data as any)?.store?.name || '');
        setSuggestedStore(deliverableId ? { id: deliverableId, name: deliverableName || null } : null);

        setNearestStoreName(deliverableName ? deliverableName : null);

        setDeliveryError(null);
        if (storeId && deliverableId && Number(storeId) !== Number(deliverableId)) {
          const msg = 'Выбранный склад не доставляет по этому адресу. Выберите ближайший склад.';
          setDeliveryWarning(msg);
        } else {
          setDeliveryWarning(null);
        }
        const status = { ok: true, message: null };
        setDeliveryStatusLocal(status);
        onDeliveryStatusChange?.(status);
      } catch {
        // ignore
      }
    })();
    return () => ac.abort();
  }, [coords, onDeliveryStatusChange, storeId]);

  const fetchStores = useCallback(async () => {
    setStoresError(null);
    setStoresLoading(true);
    try {
      const res = await fetch('/api/dark-stores?includeInactive=false', { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.stores) ? (data.stores as DarkStore[]) : [];
      setStores(list);
    } catch (e) {
      setStoresError(e instanceof Error ? e.message : 'Не удалось загрузить склады');
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  // When opened externally, ensure stores are available
  useEffect(() => {
    if (!open) return;
    if (storesLoading) return;
    if (stores.length > 0) return;
    void fetchStores();
  }, [fetchStores, open, stores.length, storesLoading]);

  const applyStore = useCallback((id: number) => {
    const sid = Math.floor(Number(id));
    if (!Number.isFinite(sid) || sid <= 0) return;
    try {
      localStorage.setItem('cd_dark_store_id', String(sid));
    } catch {
      // ignore
    }
    setStoreId(sid);
    setOpen(false);
  }, [setOpen]);

  const detectNearest = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStoresError('Геолокация недоступна. Укажите адрес или выберите склад.');
      return;
    }
    setStoresError(null);
    setNearestLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          maximumAge: 300000,
          enableHighAccuracy: true,
        });
      });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      try {
        localStorage.setItem('cd_geo_lat', String(lat));
        localStorage.setItem('cd_geo_lng', String(lng));
      } catch {
        // ignore
      }
      setCoords({ lat, lng });

      const res = await fetch(`/api/dark-stores/nearest?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as NearestResponse;
      if (!res.ok || !data || data.success !== true) {
        setStoresError(String((data as any)?.message || (data as any)?.error || 'Доставка недоступна'));
        return;
      }
      const id = Number((data as any)?.selected?.darkStoreId ?? (data as any)?.store?.id ?? 0);
      if (id) applyStore(id);
    } catch (e) {
      setStoresError(e instanceof Error ? e.message : 'Не удалось определить ближайший склад');
    } finally {
      setNearestLoading(false);
    }
  }, [applyStore]);

  const geocode = useCallback(async () => {
    const q = geoQ.trim();
    if (!q) {
      setGeoResults([]);
      return;
    }
    setGeoLoading(true);
    setStoresError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=6`, { cache: 'no-store' });
      const data = await res.json();
      const list = Array.isArray(data?.results) ? (data.results as any[]) : [];
      const mapped = list
        .map((x) => ({
          id: Number(x.id),
          label: String(x.label || ''),
          lat: Number(x.lat),
          lng: Number(x.lng),
        }))
        .filter((x) => x.label && Number.isFinite(x.lat) && Number.isFinite(x.lng));
      setGeoResults(mapped);
    } catch (e) {
      setGeoResults([]);
      setStoresError(e instanceof Error ? e.message : 'Не удалось найти адрес');
    } finally {
      setGeoLoading(false);
    }
  }, [geoQ]);

  const selectAddress = useCallback(
    async (r: { id: number; label: string; lat: number; lng: number }) => {
      const lat = Number(r.lat);
      const lng = Number(r.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      try {
        localStorage.setItem('cd_address', r.label);
        localStorage.setItem('cd_geo_lat', String(lat));
        localStorage.setItem('cd_geo_lng', String(lng));
      } catch {
        // ignore
      }
      setAddress(r.label);
      setCoords({ lat, lng });
      setGeoResults([]);

      setNearestLoading(true);
      setStoresError(null);
      try {
        const res = await fetch(`/api/dark-stores/nearest?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`, {
          cache: 'no-store',
        });
        const data = (await res.json()) as NearestResponse;
        if (!res.ok || !data || data.success !== true) {
          setStoresError(String((data as any)?.message || (data as any)?.error || 'Доставка недоступна'));
          return;
        }
        const id = Number((data as any)?.selected?.darkStoreId ?? (data as any)?.store?.id ?? 0);
        if (id) applyStore(id);
      } finally {
        setNearestLoading(false);
      }
    },
    [applyStore]
  );

  const resolvedStoreLabel = useMemo(() => {
    if (storeName) return storeName;
    if (nearestStoreName) return nearestStoreName;
    if (storeId) return `Склад #${storeId}`;
    return 'Выберите склад';
  }, [nearestStoreName, storeId, storeName]);

  const addressLabel = address || 'Укажите адрес доставки';

  // Скрываем карточку, если hideWhenOk=true и доставка доступна
  const shouldHide = hideWhenOk && deliveryStatus.ok === true && !deliveryError && !deliveryWarning;

  if (shouldHide) {
    return null;
  }

  return (
    <div className="px-4 pt-4">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="text-sm font-extrabold text-gray-900">Доставка</div>
          <button
            type="button"
            className="h-9 px-3 rounded-full bg-gray-100 text-gray-900 text-sm font-bold hover:bg-gray-200 active:scale-95 flex items-center gap-1"
            onClick={() => {
              if (onChange) {
                onChange();
                return;
              }
              setOpen(true);
            }}
            aria-label="Изменить адрес или склад"
          >
            Изменить
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {/* Показываем ошибки/предупреждения только если они есть */}
          {deliveryError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {deliveryError}
            </div>
          ) : null}

          {deliveryWarning ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 flex items-center justify-between gap-3">
              <div className="min-w-0">{deliveryWarning}</div>
              {suggestedStore?.id ? (
                <button
                  type="button"
                  className="h-9 px-3 rounded-full bg-white border border-amber-200 text-amber-900 font-extrabold text-sm hover:bg-amber-100 active:scale-[0.99] flex-shrink-0"
                  onClick={() => applyStore(suggestedStore.id)}
                >
                  Выбрать
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Показываем детали только если есть ошибка или нет адреса/склада */}
          {(deliveryError || !address || !storeId) && (
            <>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-500">Адрес</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{addressLabel}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Store className="w-4 h-4 text-gray-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-500">Склад</div>
                  <div className="text-sm font-semibold text-gray-900 truncate">{resolvedStoreLabel}</div>
                </div>
              </div>

              {etaMin ? (
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-gray-700" />
                    <div className="text-sm font-semibold text-gray-900">Привезём примерно за</div>
                  </div>
                  <div className="text-sm font-extrabold text-gray-900">{etaMin} мин</div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Samokat-like delivery picker */}
      {open ? (
        <div
          className="fixed inset-0 z-[1200] bg-black/40 flex items-end justify-center lg:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:w-[95%] md:w-[90%] max-w-[520px] bg-white rounded-t-3xl lg:rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.2)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-base font-extrabold text-gray-900">Адрес и склад</div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center active:scale-95"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
              {storesError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  {storesError}
                </div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 h-11 rounded-2xl bg-gray-900 text-white font-extrabold active:scale-[0.99] disabled:opacity-60"
                  onClick={() => void detectNearest()}
                  disabled={nearestLoading}
                >
                  {nearestLoading ? 'Определяем…' : 'Определить ближайший'}
                </button>
                <button
                  type="button"
                  className="w-11 h-11 rounded-2xl bg-gray-100 text-gray-900 flex items-center justify-center active:scale-[0.99]"
                  onClick={() => void fetchStores()}
                  aria-label="Обновить список складов"
                  title="Обновить"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="text-sm font-extrabold text-gray-900">Или укажите адрес</div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={geoQ}
                    onChange={(e) => setGeoQ(e.target.value)}
                    className="flex-1 h-11 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    placeholder="Улица, дом…"
                  />
                  <button
                    type="button"
                    className="h-11 px-4 rounded-2xl bg-gray-100 text-gray-900 font-extrabold active:scale-[0.99] disabled:opacity-60"
                    onClick={() => void geocode()}
                    disabled={geoLoading || nearestLoading}
                  >
                    {geoLoading ? '…' : 'Найти'}
                  </button>
                </div>

                {geoResults.length > 0 ? (
                  <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-100">
                    <ul className="divide-y divide-gray-100">
                      {geoResults.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-3 hover:bg-gray-50 active:bg-gray-100"
                            onClick={() => void selectAddress(r)}
                            disabled={nearestLoading}
                          >
                            <div className="text-sm font-bold text-gray-900">{r.label}</div>
                            <div className="text-xs text-gray-600">
                              {Number(r.lat).toFixed(5)}, {Number(r.lng).toFixed(5)}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-2 text-xs text-gray-600">
                  Поиск адреса даёт стабильные координаты для “планомерного покрытия” (Dark Store First).
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="text-sm font-extrabold text-gray-900">Доступные склады</div>
                {storesLoading ? (
                  <div className="mt-2 text-sm text-gray-600">Загружаем…</div>
                ) : stores.length === 0 ? (
                  <div className="mt-2 text-sm text-gray-600">Склады не найдены</div>
                ) : (
                  <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-100">
                    <ul className="divide-y divide-gray-100">
                      {stores.map((s) => {
                        const active = Number(storeId) === Number(s.id);
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-3 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between gap-3"
                              onClick={() => applyStore(s.id)}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">{s.name}</div>
                                <div className="text-xs text-gray-600">ID: {s.id}</div>
                              </div>
                              {active ? (
                                <div className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-1">
                                  Выбран
                                </div>
                              ) : (
                                <div className="text-xs font-extrabold text-gray-700 bg-gray-100 rounded-full px-2 py-1">
                                  Выбрать
                                </div>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


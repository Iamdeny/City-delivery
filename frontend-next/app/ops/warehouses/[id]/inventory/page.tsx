import Link from 'next/link';
import { fetchBffJson } from '../../../_lib/serverFetch';
import { KpiCard } from '../../../_ui/KpiCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type InventoryProduct = {
  id: number;
  name: string;
  category: string;
  price: string | number;
  image: string | null;
  in_stock: boolean;
  stock_quantity: number;
  reserved_quantity: number;
  free_quantity: number;
};

type Reservation = {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  user_id: number;
  quantity: number;
  reserved_at: string;
  expires_at: string;
  status: string;
  order_id: number | null;
  seconds_left: number | null;
};

async function fetchProducts(storeId: string): Promise<InventoryProduct[]> {
  const data = await fetchBffJson<{ success: boolean; products: InventoryProduct[] }>(
    `/api/bff/inventory/${storeId}/products`
  );
  return data.products ?? [];
}

async function fetchReservations(storeId: string): Promise<Reservation[]> {
  const data = await fetchBffJson<{ success: boolean; reservations: Reservation[] }>(
    `/api/bff/inventory/${storeId}/reservations`
  );
  return data.reservations ?? [];
}

function fmtSecondsLeft(sec: number | null) {
  if (sec === null || sec === undefined) return '—';
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function parseBool(v: unknown) {
  if (v === true || v === false) return v;
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'y' || s === 'on';
}

function parseSort(v: unknown): 'free' | 'reserved' | 'stock' | 'name' {
  const s = String(v || '').toLowerCase().trim();
  if (s === 'reserved') return 'reserved';
  if (s === 'stock') return 'stock';
  if (s === 'name') return 'name';
  return 'free';
}

export default async function WarehouseInventoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ q?: string; problemsOnly?: string; sort?: string; rq?: string; expiring?: string }>;
}) {
  const { id: storeId } = await params;
  const sp = (await searchParams) ?? {};
  const q = String(sp.q || '').trim();
  const rq = String(sp.rq || '').trim();
  const problemsOnly = parseBool(sp.problemsOnly);
  const expiringOnly = parseBool(sp.expiring);
  const sort = parseSort(sp.sort);

  let products: InventoryProduct[] = [];
  let reservations: Reservation[] = [];
  let error: string | null = null;

  try {
    [products, reservations] = await Promise.all([
      fetchProducts(storeId),
      fetchReservations(storeId),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  const lowStock = products.filter((p) => p.free_quantity <= 0 || p.stock_quantity <= 0);
  const qLower = q.toLowerCase();
  const rqLower = rq.toLowerCase();

  const filteredProducts = products
    .filter((p) => {
      if (problemsOnly && !(p.free_quantity <= 0 || p.stock_quantity <= 0)) return false;
      if (!qLower) return true;
      const hay = `${p.id} ${p.name} ${p.category}`.toLowerCase();
      return hay.includes(qLower);
    })
    .sort((a, b) => {
      if (sort === 'name') return String(a.name).localeCompare(String(b.name), 'ru');
      if (sort === 'stock') return Number(b.stock_quantity) - Number(a.stock_quantity);
      if (sort === 'reserved') return Number(b.reserved_quantity) - Number(a.reserved_quantity);
      // free (default): problems first + low free first
      const ap = a.free_quantity <= 0 || a.stock_quantity <= 0 ? 1 : 0;
      const bp = b.free_quantity <= 0 || b.stock_quantity <= 0 ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return Number(a.free_quantity) - Number(b.free_quantity);
    });

  const filteredReservations = reservations
    .filter((r) => {
      if (expiringOnly) {
        const left = r.seconds_left ?? null;
        if (left === null) return false;
        if (left > 300) return false; // <=5 min
      }
      if (!rqLower) return true;
      const hay = `${r.id} ${r.product_id} ${r.product_name} ${r.user_id} ${r.order_id ?? ''}`.toLowerCase();
      return hay.includes(rqLower);
    })
    .sort((a, b) => {
      const al = a.seconds_left ?? Number.POSITIVE_INFINITY;
      const bl = b.seconds_left ?? Number.POSITIVE_INFINITY;
      return al - bl;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href={`/ops/warehouses/${storeId}`} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            ← Назад к складу
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">Остатки и резервы</h1>
          <p className="mt-2 text-gray-600">Склад #{storeId}: stock / reserved / free + активные резервации (TTL).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/ops/warehouses/${storeId}/inventory?${new URLSearchParams({
              q,
              problemsOnly: problemsOnly ? 'true' : '',
              sort,
              rq,
              expiring: expiringOnly ? 'true' : '',
            }).toString()}`}
            className="text-sm font-extrabold text-gray-900 hover:text-gray-700"
            title="Перезагрузить данные"
          >
            Обновить ↻
          </Link>
          <a
            href={`/api/bff/inventory/${storeId}/products`}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Открыть JSON API
          </a>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="font-bold">Не удалось загрузить остатки</div>
          <div className="text-sm mt-1">{error}</div>
        </div>
      ) : null}

      {!error ? (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <form
              method="get"
              action={`/ops/warehouses/${storeId}/inventory`}
              className="grid grid-cols-1 md:grid-cols-12 gap-3"
            >
              <div className="md:col-span-5">
                <div className="text-xs font-semibold text-gray-600">Поиск по товарам</div>
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="id / название / категория"
                  data-ops-hotkey="search"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-gray-600">Сортировка</div>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                >
                  <option value="free">Free (проблемные сверху)</option>
                  <option value="stock">Stock</option>
                  <option value="reserved">Reserved</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input type="checkbox" name="problemsOnly" defaultChecked={problemsOnly} />
                  Только проблемные
                </label>
              </div>

              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-gray-600">Поиск по резервациям</div>
                <input
                  name="rq"
                  defaultValue={rq}
                  placeholder="res# / prod# / user# / order#"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                />
              </div>

              <div className="md:col-span-3 flex items-end">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <input type="checkbox" name="expiring" defaultChecked={expiringOnly} />
                  Expiring ≤ 5 мин
                </label>
              </div>

              <div className="md:col-span-12 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-gray-600">
                  Товары: <span className="text-gray-900">{filteredProducts.length}</span> из{' '}
                  <span className="text-gray-900">{products.length}</span> · Резервации:{' '}
                  <span className="text-gray-900">{filteredReservations.length}</span> из{' '}
                  <span className="text-gray-900">{reservations.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/ops/warehouses/${storeId}/inventory`}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-extrabold text-gray-900"
                    title="Сбросить фильтры"
                  >
                    Сбросить
                  </Link>
                  <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white">Применить</button>
                </div>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Товаров" value={products.length} />
            <KpiCard label="Проблемные (free=0)" value={lowStock.length} />
            <KpiCard label="Активных резерваций" value={reservations.length} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">Товары</div>
              <div className="text-xs text-gray-500">free = stock − reserved</div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Товар</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Free</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => {
                  const isProblem = p.free_quantity <= 0 || p.stock_quantity <= 0;
                  const ok = p.in_stock && p.free_quantity > 0;
                  return (
                    <TableRow key={p.id} className={isProblem ? 'bg-red-50/50 hover:bg-red-50/60' : undefined}>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">#{p.id}</div>
                      </TableCell>
                      <TableCell className="text-gray-700">{p.category}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">{p.stock_quantity}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">{p.reserved_quantity}</TableCell>
                      <TableCell className="text-right font-extrabold text-gray-900">{p.free_quantity}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                            ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {ok ? 'Доступен' : 'Нет'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="font-extrabold text-gray-900">Активные резервации</div>
              <a
                href={`/api/bff/inventory/${storeId}/reservations`}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                JSON
              </a>
            </div>
            {filteredReservations.length === 0 ? (
              <div className="p-5 text-gray-600">Активных резерваций нет.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Товар</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">TTL</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{r.product_name}</div>
                        <div className="text-xs text-gray-500">res#{r.id} · prod#{r.product_id}</div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">{r.quantity}</TableCell>
                      <TableCell className="text-right font-extrabold text-gray-900">{fmtSecondsLeft(r.seconds_left)}</TableCell>
                      <TableCell className="text-gray-700">#{r.user_id}</TableCell>
                      <TableCell className="text-gray-700">{r.order_id ? `#${r.order_id}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}


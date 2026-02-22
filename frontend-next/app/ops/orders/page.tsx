import { OrdersLiveDashboardClient } from './OrdersLiveDashboardClient';

export default function OpsOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Заказы · Живая очередь</h1>
        <p className="mt-2 text-sm text-gray-600">Ops‑first: статусы, фильтры, “здоровье системы”, действия без лишних переходов.</p>
      </div>

      <OrdersLiveDashboardClient />
    </div>
  );
}


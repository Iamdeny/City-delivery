import { AuditTableClient } from './AuditTableClient';

export default function OpsAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Аудит</h1>
        <p className="mt-2 text-sm text-gray-600">
          Журнал действий операторов (admin/manager): заказы, возвраты, склады, пользователи.
        </p>
      </div>

      <AuditTableClient />
    </div>
  );
}


import Link from 'next/link';
import { UsersTableClient } from './UsersTableClient';

export default function OpsUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/ops/warehouses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Ops: склады
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Пользователи</h1>
        <p className="mt-2 text-sm text-gray-600">
          Только для ролей <span className="font-semibold text-gray-900">admin/manager</span>.
        </p>
      </div>

      <UsersTableClient />
    </div>
  );
}


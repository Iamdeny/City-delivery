type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'picking'
  | 'ready'
  | 'assigned_to_courier'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'cancelled'
  | string;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Новый',
  preparing: 'Подготовка',
  picking: 'Сборка',
  ready: 'Готов',
  assigned_to_courier: 'Назначен курьеру',
  picked_up: 'Забран',
  delivering: 'В пути',
  delivered: 'Доставлен',
  cancelled: 'Отменён',
};

function pillClass(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-700';
    case 'delivering':
    case 'picked_up':
    case 'assigned_to_courier':
      return 'bg-blue-100 text-blue-800';
    case 'ready':
      return 'bg-purple-100 text-purple-800';
    case 'pending':
    case 'preparing':
    case 'picking':
      return 'bg-amber-100 text-amber-900';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function StatusPill({ status, isLate }: { status: OrderStatus; isLate?: boolean }) {
  const cls = isLate ? 'bg-red-100 text-red-800' : pillClass(status);
  const label = STATUS_LABEL[String(status)] ?? String(status);
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold ${cls}`}>{label}</span>;
}


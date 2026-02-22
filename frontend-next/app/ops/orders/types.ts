export type LiveOrder = {
  id: number;
  status: string;
  total: string | number;
  created_at: string;
  updated_at: string;
  client_id: number;
  phone: string;
  address: string;
  dark_store_id: number | null;
  dark_store_name: string | null;
  courier_id: number | null;
  is_late: boolean;
  items_count: number;
  ordered_qty_total: number;
  returned_qty_total: number | null;
};

export type LiveOrdersResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  orders: LiveOrder[];
  health: {
    byStatus: Record<string, number>;
    lateCount: number;
    needsCourierCount: number;
  };
};

export type DarkStoreLite = {
  id: number;
  name: string;
  is_active: boolean;
};


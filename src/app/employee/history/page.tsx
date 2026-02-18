import OrderHistory from './OrderHistory';
import { createClient } from '../../../../utils/supabase/server';

type Profile = {
  id: string;
  full_name: string | null;
};

type RequestRow = {
  id: string;
  created_at: string;
  total_cost: number | null;
  status: string;
};

type RequestItemRow = {
  id: string;
  request_id: string;
  item_id: string;
  quantity: number;
  size: string | null;
  unit_cost: number | null;
};

type ItemRow = {
  id: string;
  name: string;
};

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  size: string | null;
};

export type OrderSummary = {
  id: string;
  createdAt: string;
  totalCost: number;
  status: string;
  items: OrderItem[];
};

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should already handle this, but guard just in case.
    return null;
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single();

  const profile: Profile =
    (profileData as Profile | null) ?? {
      id: user.id,
      full_name: user.email,
    };

  const { data: requestsData } = await supabase
    .from('requests')
    .select('id, created_at, total_cost, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const requestRows = (requestsData ?? []) as RequestRow[];

  if (requestRows.length === 0) {
    return <OrderHistory profile={profile} orders={[]} />;
  }

  const requestIds = requestRows.map((request) => request.id);

  const { data: requestItemsData } = await supabase
    .from('request_items')
    .select('id, request_id, item_id, quantity, size, unit_cost')
    .in('request_id', requestIds);

  const requestItemRows = (requestItemsData ?? []) as RequestItemRow[];

  const itemIds = Array.from(
    new Set(requestItemRows.map((row) => row.item_id)),
  );

  const { data: itemsData } = await supabase
    .from('items')
    .select('id, name')
    .in('id', itemIds);

  const itemRows = (itemsData ?? []) as ItemRow[];
  const itemMap = new Map(itemRows.map((row) => [row.id, row]));

  const orders: OrderSummary[] = requestRows.map((request) => {
    const itemsForRequest = requestItemRows.filter(
      (row) => row.request_id === request.id,
    );

    const items: OrderItem[] = itemsForRequest.map((row) => ({
      id: row.id,
      name: itemMap.get(row.item_id)?.name ?? 'Item',
      quantity: row.quantity,
      size: row.size,
    }));

    const itemsCost = itemsForRequest.reduce(
      (sum, row) => sum + (row.unit_cost ?? 0) * row.quantity,
      0,
    );

    return {
      id: request.id,
      createdAt: request.created_at,
      totalCost: request.total_cost ?? itemsCost,
      status: request.status,
      items,
    };
  });

  return <OrderHistory profile={profile} orders={orders} />;
}


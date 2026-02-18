import DispatchQueue from './DispatchQueue';
import { createClient } from '../../../../utils/supabase/server';

type RequestRow = {
  id: string;
  user_id: string;
  created_at: string;
  approved_at: string | null;
  total_cost: number | null;
  status: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  branch: string | null;
  cost_centre: string | null;
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

type RequestCostRow = {
  request_id: string;
  embroidery_cost: number | null;
  shipping_cost: number | null;
};

export type DispatchRequest = {
  id: string;
  employeeName: string;
  branch: string | null;
  costCentre: string | null;
  approvedAt: string;
  itemsCost: number;
  embroideryCost: number;
  shippingCost: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    size: string | null;
  }[];
};

export default async function Page() {
  const supabase = await createClient();

  const { data: requestsData } = await supabase
    .from('requests')
    .select('id, user_id, created_at, approved_at, total_cost, status')
    .eq('status', 'approved');

  const requestRows = (requestsData ?? []) as RequestRow[];

  if (requestRows.length === 0) {
    return <DispatchQueue requests={[]} />;
  }

  // Oldest approved first (fallback to created_at if approved_at is null)
  requestRows.sort((a, b) => {
    const aDate = new Date(a.approved_at ?? a.created_at).getTime();
    const bDate = new Date(b.approved_at ?? b.created_at).getTime();
    return aDate - bDate;
  });

  const userIds = Array.from(new Set(requestRows.map((row) => row.user_id)));
  const requestIds = requestRows.map((row) => row.id);

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, full_name, branch, cost_centre')
    .in('id', userIds);

  const profileRows = (profilesData ?? []) as ProfileRow[];

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

  const { data: requestCostsData } = await supabase
    .from('request_costs')
    .select('request_id, embroidery_cost, shipping_cost')
    .in('request_id', requestIds);

  const requestCostRows = (requestCostsData ?? []) as RequestCostRow[];

  const profileMap = new Map(profileRows.map((row) => [row.id, row]));
  const itemMap = new Map(itemRows.map((row) => [row.id, row]));
  const costMap = new Map(
    requestCostRows.map((row) => [row.request_id, row]),
  );

  const dispatchRequests: DispatchRequest[] = requestRows.map((request) => {
    const profile = profileMap.get(request.user_id);

    const itemsForRequest = requestItemRows.filter(
      (row) => row.request_id === request.id,
    );

    const items = itemsForRequest.map((row) => ({
      id: row.id,
      name: itemMap.get(row.item_id)?.name ?? 'Item',
      quantity: row.quantity,
      size: row.size,
    }));

    const itemsCost = itemsForRequest.reduce(
      (sum, row) => sum + (row.unit_cost ?? 0) * row.quantity,
      0,
    );

    const costs = costMap.get(request.id);

    return {
      id: request.id,
      employeeName: profile?.full_name ?? 'Employee',
      branch: profile?.branch ?? null,
      costCentre: profile?.cost_centre ?? null,
      approvedAt: request.approved_at ?? request.created_at,
      itemsCost,
      embroideryCost: costs?.embroidery_cost ?? 0,
      shippingCost: costs?.shipping_cost ?? 0,
      items,
    };
  });

  return <DispatchQueue requests={dispatchRequests} />;
}


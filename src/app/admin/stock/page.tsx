import StockDashboard from './StockDashboard';
import { createClient } from '../../../../utils/supabase/server';

type Item = {
  id: string;
  name: string;
  category: string | null;
  size: string | null;
  supplier: string | null;
  stock_balance: number | null;
  unit_cost: number | null;
  low_stock_threshold: number | null;
};

export default async function Page() {
  const supabase = await createClient();

  const { data: itemsData } = await supabase
    .from('items')
    .select(
      'id, name, category, size, supplier, stock_balance, unit_cost, low_stock_threshold',
    );

  const items = (itemsData ?? []) as Item[];

  return <StockDashboard items={items} />;
}


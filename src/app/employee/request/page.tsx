import RequestForm from './RequestForm';
import { createClient } from '../../../../utils/supabase/server';

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  manager_id: string | null;
};

type Item = {
  id: string;
  name: string;
  supplier: string | null;
  unit_cost: number | null;
  stock_balance: number | null;
  category: string | null;
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
    .select('id, full_name, email, manager_id')
    .eq('id', user.id)
    .single();

  const profile: Profile =
    (profileData as Profile | null) ?? {
      id: user.id,
      full_name: user.email ?? null,
      email: user.email ?? null,
      manager_id: null,
    };

  const { data: itemsData } = await supabase
    .from('items')
    .select('id, name, supplier, unit_cost, stock_balance, category');

  const items = (itemsData ?? []) as Item[];

  return <RequestForm profile={profile} items={items} />;
}


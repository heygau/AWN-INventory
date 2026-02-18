import UserManagement from './UserManagement';
import { createClient } from '../../../../utils/supabase/server';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  branch: string | null;
  cost_centre: string | null;
  role: string | null;
  manager_id: string | null;
};

export default async function Page() {
  const supabase = await createClient();

  const { data: profilesData } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, branch, cost_centre, role, manager_id',
    );

  const profiles = (profilesData ?? []) as Profile[];

  return <UserManagement profiles={profiles} />;
}


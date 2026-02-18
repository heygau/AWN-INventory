import ManagerApprovals from './ManagerApprovals';
import { createClient } from '../../../../utils/supabase/server';

type ManagerProfile = {
  id: string;
  full_name: string | null;
};

export default async function Page() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Protected by middleware, but guard just in case.
    return null;
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .single();

  const managerProfile = (profileData ??
    ({
      id: user.id,
      full_name: user.email,
    } as ManagerProfile)) satisfies ManagerProfile;

  return <ManagerApprovals manager={managerProfile} />;
}


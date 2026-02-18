import Redirector from './Redirector';
import { createClient } from '../../../utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  let targetPath = '/';

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role as string | undefined;

      if (role === 'employee') {
        targetPath = '/employee/request';
      } else if (role === 'manager') {
        targetPath = '/manager/approvals';
      } else if (role === 'admin') {
        targetPath = '/admin/stock';
      } else {
        targetPath = '/';
      }
    } else {
      targetPath = '/';
    }
  } catch {
    targetPath = '/';
  }

  return <Redirector to={targetPath} />;
}


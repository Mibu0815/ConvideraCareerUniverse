import { getRoles } from '@/app/actions/get-roles';
import { CompareView } from './components/CompareView';

// Force dynamic rendering (requires database connection)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Role Comparison | Career Universe',
  description: 'Compare skills and responsibilities between roles',
};

export default async function ComparePage() {
  const groupedRoles = await getRoles();

  return <CompareView groupedRoles={groupedRoles} />;
}

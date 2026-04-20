import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/user-sync';
import { getRoles } from '@/app/actions/get-roles';
import { createClient } from '@/lib/supabase/server';
import { Navigation } from '@/components/shared/Navigation';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  const groupedRoles = await getRoles();

  // Find role names
  const allRoles = groupedRoles.flatMap(g => g.roles);
  const currentRole = user.currentRoleId ? allRoles.find(r => r.id === user.currentRoleId) : null;
  const targetRole = user.targetRoleId ? allRoles.find(r => r.id === user.targetRoleId) : null;

  return (
    <>
      <Navigation userName={user.name} />
      <div className="min-h-screen bg-gray-50 pt-14">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-convidera-dark mb-8">Mein Profil</h1>

          <ProfileForm
            userId={user.id}
            initialName={user.name || ''}
            email={supabaseUser?.email || user.email}
            currentRoleName={currentRole?.title || null}
            targetRoleName={targetRole?.title || null}
            currentRoleId={user.currentRoleId}
            targetRoleId={user.targetRoleId}
            groupedRoles={groupedRoles}
            memberSince={supabaseUser?.created_at || null}
          />
        </div>
      </div>
    </>
  );
}

import { getRoles, type GroupedRoles } from '@/app/actions/get-roles';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getDashboardLearningData, type DashboardLearningData } from '@/app/actions/learning-journey';
import { ValidationBadge } from '@/components/shared/ValidationBadge';
import { CompareView } from './components/CompareView';
import type { PlatformRole } from '@prisma/client';

// Force dynamic rendering (requires database connection)
export const dynamic = 'force-dynamic';

interface UserWithLearningData {
  id: string;
  currentRoleId: string | null;
  targetRoleId: string | null;
  planId: string | null;
  focusedSkillIds: string[];
  learningData: DashboardLearningData | null;
  platformRole: PlatformRole;
}

async function getUserWithLearningData(): Promise<UserWithLearningData | null> {
  try {
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email },
      select: {
        id: true,
        currentRoleId: true,
        targetRoleId: true,
        platformRole: true,
        LearningPlan: {
          select: {
            id: true,
            LearningFocus: {
              where: { status: 'IN_PROGRESS' },
              select: { skillId: true },
            },
          },
        },
      },
    });

    if (!user) return null;

    // Fetch dashboard learning data in parallel
    const learningData = await getDashboardLearningData(user.id);

    return {
      id: user.id,
      currentRoleId: user.currentRoleId,
      targetRoleId: user.targetRoleId,
      planId: user.LearningPlan?.id || null,
      focusedSkillIds: user.LearningPlan?.LearningFocus.map(f => f.skillId) ?? [],
      learningData,
      platformRole: user.platformRole,
    };
  } catch {
    return null;
  }
}

export const metadata = {
  title: 'Role Comparison | Career Universe',
  description: 'Compare skills and responsibilities between roles',
};

// Error fallback component
function DatabaseError({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-brand-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">
          Datenbank nicht verfügbar
        </h1>
        <p className="text-brand-gray-600 mb-6">
          {message}
        </p>
        <div className="space-y-3 text-left bg-brand-gray-50 rounded-xl p-4">
          <p className="text-sm font-medium text-brand-gray-700">Mögliche Ursachen:</p>
          <ul className="text-sm text-brand-gray-600 space-y-1">
            <li>• DATABASE_URL nicht konfiguriert</li>
            <li>• Datenbank noch nicht initialisiert</li>
            <li>• Keine Rollen in der Datenbank</li>
          </ul>
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-xl text-left">
          <p className="text-sm font-medium text-blue-900 mb-2">Lösung:</p>
          <code className="text-xs text-blue-800 block">
            ./deploy-seed.sh
          </code>
        </div>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-brand-black text-white rounded-xl font-medium hover:bg-brand-gray-800 transition-colors"
        >
          Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}

export default async function ComparePage() {
  let groupedRoles: GroupedRoles[] = [];
  let error: string | null = null;

  try {
    // Fetch roles and user data in parallel
    const [roles, userData] = await Promise.all([
      getRoles(),
      getUserWithLearningData(),
    ]);

    groupedRoles = roles;

    // Check if database is empty
    if (!groupedRoles || groupedRoles.length === 0) {
      error = 'Die Datenbank enthält noch keine Rollen. Bitte führen Sie das Seed-Script aus.';
    }

    if (error) {
      return <DatabaseError message={error} />;
    }

    return (
      <CompareView
        groupedRoles={groupedRoles}
        initialFromRoleId={userData?.currentRoleId || null}
        initialToRoleId={userData?.targetRoleId || null}
        userId={userData?.id || null}
        initialFocusedSkillIds={userData?.focusedSkillIds ?? []}
        initialPlanId={userData?.planId || null}
        completedImpulses={userData?.learningData?.recentCompletedImpulses ?? []}
        totalFocusedSkills={userData?.learningData?.inProgressSkills.length ?? 0}
        platformRole={userData?.platformRole}
        validationBadge={<ValidationBadge />}
      />
    );
  } catch (e) {
    console.error('Database error:', e);
    error = e instanceof Error
      ? e.message
      : 'Verbindung zur Datenbank fehlgeschlagen.';
  }

  if (error) {
    return <DatabaseError message={error} />;
  }

  return <CompareView groupedRoles={groupedRoles} />;
}

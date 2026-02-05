import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getDashboardLearningData, type DashboardLearningData } from '@/app/actions/learning-journey';
import CareerUniverse from '@/components/CareerUniverse';

// Ensure fresh data on each request (no caching)
export const dynamic = 'force-dynamic';

async function getUserWithRolesAndLearning() {
  const supabase = await createClient();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: supabaseUser.email },
    select: {
      id: true,
      name: true,
      email: true,
      currentRoleId: true,
      targetRoleId: true,
    },
  });

  if (!user) return null;

  // Fetch role details and learning data in parallel
  const [currentRole, targetRole, learningData] = await Promise.all([
    user.currentRoleId
      ? prisma.role.findUnique({
          where: { id: user.currentRoleId },
          select: { id: true, title: true, level: true, hasLeadership: true, leadershipType: true },
        })
      : null,
    user.targetRoleId
      ? prisma.role.findUnique({
          where: { id: user.targetRoleId },
          select: { id: true, title: true, level: true, hasLeadership: true, leadershipType: true },
        })
      : null,
    getDashboardLearningData(user.id),
  ]);

  return {
    ...user,
    currentRole,
    targetRole,
    learningData,
  };
}

export default async function Home() {
  const userData = await getUserWithRolesAndLearning();

  // Redirect users without currentRole to onboarding/my-career
  if (userData && !userData.currentRole) {
    redirect('/my-career');
  }

  return <CareerUniverse userData={userData} />;
}

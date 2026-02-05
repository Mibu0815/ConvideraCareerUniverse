import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getDashboardLearningData, getLearningRoadmap, type DashboardLearningData } from '@/app/actions/learning-journey';
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

  // Fetch role details, learning data, and roadmap in parallel
  const [currentRole, targetRole, learningData, roadmap] = await Promise.all([
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
    getLearningRoadmap(user.id),
  ]);

  // Calculate progress toward target role
  const totalGaps = roadmap.meta.totalGaps;
  const completedSkillsCount = await prisma.learningFocus.count({
    where: {
      LearningPlan: { userId: user.id },
      status: "COMPLETED",
    },
  });

  // Progress is based on completed skills vs total gaps
  const progressPercent = totalGaps > 0
    ? Math.round((completedSkillsCount / totalGaps) * 100)
    : 0;

  return {
    ...user,
    currentRole,
    targetRole,
    learningData,
    progressData: {
      totalGaps,
      completedSkillsCount,
      progressPercent,
    },
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

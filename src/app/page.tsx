import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getDashboardLearningData, getLearningRoadmap, type DashboardLearningData } from '@/app/actions/learning-journey';
import { getUserState } from '@/lib/userStateGuard';
import CareerUniverse from '@/components/CareerUniverse';
import { Navigation } from '@/components/shared/Navigation';
import { ValidationBadge } from '@/components/shared/ValidationBadge';

// Ensure fresh data on each request (no caching)
export const dynamic = 'force-dynamic';

// Helper to calculate streak (consecutive days with activity)
async function calculateStreak(userId: string): Promise<number> {
  const activities = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (activities.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Group activities by date
  const activityDates = new Set(
    activities.map(a => {
      const d = new Date(a.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  // Check if there's activity today or yesterday (to not break streak)
  const today = currentDate.getTime();
  const yesterday = today - 86400000;

  if (!activityDates.has(today) && !activityDates.has(yesterday)) {
    return 0; // Streak broken
  }

  // Count consecutive days backwards
  let checkDate = activityDates.has(today) ? today : yesterday;
  while (activityDates.has(checkDate)) {
    streak++;
    checkDate -= 86400000;
  }

  return streak;
}

// Helper to detect soft skill
function isSoftSkill(skillName: string): boolean {
  const softSkillPatterns = /stakeholder|kommunikation|feedback|präsentation|moderation|coaching|leadership|team|konflikt|verhandlung|empathie|negotiation|facilitation/i;
  return softSkillPatterns.test(skillName);
}

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
      platformRole: true,
    },
  });

  if (!user) return null;

  // Fetch all data in parallel
  const [currentRole, targetRole, learningData, roadmap, activeGoal, streak] = await Promise.all([
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
    // Get active career goal
    prisma.careerGoal.findFirst({
      where: {
        userId: user.id,
        status: { in: ['EXPLORING', 'COMMITTED'] },
      },
      include: {
        Role: { select: { title: true, level: true } },
      },
      orderBy: { priority: 'asc' },
    }),
    calculateStreak(user.id),
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

  // Determine the primary focus skill and if it's a soft skill
  const primaryFocusSkill = learningData.inProgressSkills[0] ?? null;
  const primarySkillIsSoft = primaryFocusSkill
    ? isSoftSkill(primaryFocusSkill.skillName)
    : false;

  // Calculate remaining impulses for "level up" (estimate: ~3 impulses per skill gap)
  const inProgressCount = learningData.inProgressSkills.length;
  const remainingImpulsesEstimate = Math.max(0, (totalGaps - completedSkillsCount) * 3 - learningData.completedImpulsesCount);

  return {
    ...user,
    currentRole,
    targetRole,
    learningData,
    activeGoal: activeGoal ? {
      roleTitle: activeGoal.Role.title,
      roleLevel: activeGoal.Role.level,
      status: activeGoal.status,
    } : null,
    progressData: {
      totalGaps,
      completedSkillsCount,
      progressPercent,
      remainingImpulses: remainingImpulsesEstimate,
    },
    streak,
    primaryFocusSkill,
    primarySkillIsSoft,
  };
}

export default async function Home() {
  const userData = await getUserWithRolesAndLearning();

  // Not logged in - show landing page
  if (!userData) {
    return <CareerUniverse userData={null} />;
  }

  // Use UserStateGuard for smart routing
  const userState = await getUserState(userData.id);

  // Redirect based on user state
  // 'onboarding' → /my-career (no roles set)
  // 'setup' → /my-career/compare (roles set, no focus skills)
  // 'active' → show dashboard with personalized content
  if (userState.state === 'onboarding') {
    redirect('/my-career');
  }

  // For 'setup' state: Show dashboard but with clear CTA to select skills
  // For 'active' state: Show full personalized dashboard

  return (
    <>
      <Navigation
        userName={userData.name ?? userData.email}
        platformRole={userData.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <CareerUniverse userData={userData} userState={userState} />
    </>
  );
}

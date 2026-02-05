// lib/userStateGuard.ts
import { prisma } from './prisma';

export type UserState = 'onboarding' | 'setup' | 'active' | 'ready';

export interface UserStateResult {
  state: UserState;
  redirectPath: string;
  hasCurrentRole: boolean;
  hasTargetRole: boolean;
  hasFocusSkills: boolean;
  focusSkillsCount: number;
}

/**
 * Determines the user's state and optimal redirect path based on their profile completion
 * and learning progress.
 *
 * States:
 * - 'onboarding': User hasn't set current role → /my-career
 * - 'setup': User has roles but no focus skills → /my-career/compare
 * - 'active': User has focus skills in progress → /learning-journey
 * - 'ready': User completed all focus skills → / (dashboard)
 */
export async function getUserState(userId: string): Promise<UserStateResult> {
  // Fetch user with roles and focus skills count in parallel
  const [user, focusCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentRoleId: true,
        targetRoleId: true,
      },
    }),
    prisma.learningFocus.count({
      where: {
        LearningPlan: { userId },
        status: 'IN_PROGRESS',
      },
    }),
  ]);

  const hasCurrentRole = !!user?.currentRoleId;
  const hasTargetRole = !!user?.targetRoleId;
  const hasFocusSkills = focusCount > 0;

  // Determine state and redirect path
  if (!hasCurrentRole || !hasTargetRole) {
    return {
      state: 'onboarding',
      redirectPath: '/my-career',
      hasCurrentRole,
      hasTargetRole,
      hasFocusSkills,
      focusSkillsCount: focusCount,
    };
  }

  if (!hasFocusSkills) {
    return {
      state: 'setup',
      redirectPath: '/my-career/compare',
      hasCurrentRole,
      hasTargetRole,
      hasFocusSkills,
      focusSkillsCount: focusCount,
    };
  }

  // User has focus skills - check if they're actively learning
  return {
    state: 'active',
    redirectPath: '/learning-journey',
    hasCurrentRole,
    hasTargetRole,
    hasFocusSkills,
    focusSkillsCount: focusCount,
  };
}

/**
 * Simple helper to get just the redirect path
 */
export async function getUserRedirectPath(userId: string): Promise<string> {
  const state = await getUserState(userId);
  return state.redirectPath;
}

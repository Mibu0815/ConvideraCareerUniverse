'use server';

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPES
// ============================================================================

export interface PathwayRole {
  id: string;
  title: string;
  slug: string;
  level: string;
  levelOrder: number;
  hasLeadership: boolean;
  leadershipType: string | null;
  fieldId: string;
  fieldTitle: string;
  team: string | null;
}

export interface RecommendedPath {
  role: PathwayRole;
  reason: string;
  skillGap: number;
  isNextLogicalStep: boolean;
  isRecommended: boolean;
  popularity?: number; // How many others took this path
}

export interface PathwayCategory {
  title: string;
  description: string;
  icon: string;
  roles: RecommendedPath[];
}

export interface PersonalizedPathways {
  currentRole: PathwayRole | null;
  categories: PathwayCategory[];
  totalAvailableRoles: number;
}

// ============================================================================
// LEVEL ORDERING
// ============================================================================

const LEVEL_ORDER: Record<string, number> = {
  JUNIOR: 1,
  PROFESSIONAL: 2,
  SENIOR: 3,
  FUNCTIONAL_LEAD: 4,
  HEAD_OF: 5,
};

function getLevelOrder(level: string): number {
  return LEVEL_ORDER[level] || 0;
}

function getNextLevel(currentLevel: string): string | null {
  const order = getLevelOrder(currentLevel);
  const entries = Object.entries(LEVEL_ORDER);
  const next = entries.find(([_, o]) => o === order + 1);
  return next ? next[0] : null;
}

// ============================================================================
// PATHWAY CALCULATION
// ============================================================================

/**
 * Get personalized career pathways for a user
 */
export async function getPersonalizedPathways(userId: string): Promise<PersonalizedPathways> {
  // Get user with current role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentRoleId: true,
      targetRoleId: true,
    },
  });

  if (!user) {
    return { currentRole: null, categories: [], totalAvailableRoles: 0 };
  }

  // Get current role details
  const currentRole = user.currentRoleId
    ? await prisma.role.findUnique({
        where: { id: user.currentRoleId },
        include: { OccupationalField: true },
      })
    : null;

  // Get all roles
  const allRoles = await prisma.role.findMany({
    include: { OccupationalField: true },
    orderBy: [{ OccupationalField: { title: 'asc' } }, { level: 'asc' }],
  });

  // Get career goal transitions for popularity data
  const popularTransitions = await prisma.careerGoal.groupBy({
    by: ['roleId'],
    _count: { roleId: true },
    orderBy: { _count: { roleId: 'desc' } },
    take: 20,
  });

  const popularityMap = new Map(
    popularTransitions.map((t) => [t.roleId, t._count.roleId])
  );

  // Transform roles to PathwayRole format
  const pathwayRoles: PathwayRole[] = allRoles.map((role) => ({
    id: role.id,
    title: role.title,
    slug: role.slug,
    level: role.level,
    levelOrder: getLevelOrder(role.level),
    hasLeadership: role.hasLeadership,
    leadershipType: role.leadershipType,
    fieldId: role.fieldId,
    fieldTitle: role.OccupationalField.title,
    team: role.team,
  }));

  // Categorize roles
  const categories: PathwayCategory[] = [];

  if (currentRole) {
    const currentPathwayRole: PathwayRole = {
      id: currentRole.id,
      title: currentRole.title,
      slug: currentRole.slug,
      level: currentRole.level,
      levelOrder: getLevelOrder(currentRole.level),
      hasLeadership: currentRole.hasLeadership,
      leadershipType: currentRole.leadershipType,
      fieldId: currentRole.fieldId,
      fieldTitle: currentRole.OccupationalField.title,
      team: currentRole.team,
    };

    // 1. Next Logical Step (same field, next level)
    const nextLogicalSteps = pathwayRoles
      .filter((role) => {
        return (
          role.fieldId === currentRole.fieldId &&
          role.levelOrder === currentPathwayRole.levelOrder + 1
        );
      })
      .map((role) => ({
        role,
        reason: `Nächste Stufe in ${role.fieldTitle}`,
        skillGap: calculateEstimatedGap(currentPathwayRole, role),
        isNextLogicalStep: true,
        isRecommended: true,
        popularity: popularityMap.get(role.id) || 0,
      }));

    if (nextLogicalSteps.length > 0) {
      categories.push({
        title: 'Dein nächster logischer Schritt',
        description: 'Empfohlener Karrierepfad basierend auf deiner aktuellen Rolle',
        icon: '🚀',
        roles: nextLogicalSteps,
      });
    }

    // 2. Lateral Moves (same level, different field)
    const lateralMoves = pathwayRoles
      .filter((role) => {
        return (
          role.fieldId !== currentRole.fieldId &&
          role.levelOrder === currentPathwayRole.levelOrder
        );
      })
      .slice(0, 5)
      .map((role) => ({
        role,
        reason: `Wechsel zu ${role.fieldTitle} auf gleichem Level`,
        skillGap: calculateEstimatedGap(currentPathwayRole, role),
        isNextLogicalStep: false,
        isRecommended: false,
        popularity: popularityMap.get(role.id) || 0,
      }));

    if (lateralMoves.length > 0) {
      categories.push({
        title: 'Cross-Functional Explorer',
        description: 'Entdecke neue Bereiche auf deinem aktuellen Level',
        icon: '🔀',
        roles: lateralMoves.sort((a, b) => b.popularity - a.popularity),
      });
    }

    // 3. Leadership Track (if applicable)
    const leadershipRoles = pathwayRoles
      .filter((role) => {
        return (
          role.hasLeadership &&
          role.levelOrder > currentPathwayRole.levelOrder &&
          !nextLogicalSteps.some((ns) => ns.role.id === role.id)
        );
      })
      .slice(0, 4)
      .map((role) => ({
        role,
        reason: `Führungsrolle: ${role.leadershipType || 'Team Lead'}`,
        skillGap: calculateEstimatedGap(currentPathwayRole, role),
        isNextLogicalStep: false,
        isRecommended: role.fieldId === currentRole.fieldId,
        popularity: popularityMap.get(role.id) || 0,
      }));

    if (leadershipRoles.length > 0) {
      categories.push({
        title: 'Leadership Track',
        description: 'Wege in Führungspositionen',
        icon: '👑',
        roles: leadershipRoles,
      });
    }

    // 4. Popular Paths (based on what others chose)
    const popularRoles = pathwayRoles
      .filter((role) => {
        const popularity = popularityMap.get(role.id) || 0;
        return (
          popularity >= 2 &&
          role.id !== currentRole.id &&
          !nextLogicalSteps.some((ns) => ns.role.id === role.id)
        );
      })
      .slice(0, 5)
      .map((role) => ({
        role,
        reason: `${popularityMap.get(role.id)} Kollegen haben diesen Pfad gewählt`,
        skillGap: calculateEstimatedGap(currentPathwayRole, role),
        isNextLogicalStep: false,
        isRecommended: false,
        popularity: popularityMap.get(role.id) || 0,
      }));

    if (popularRoles.length > 0) {
      categories.push({
        title: 'Beliebte Karrierepfade',
        description: 'Was andere bei Convidera gewählt haben',
        icon: '📊',
        roles: popularRoles.sort((a, b) => b.popularity - a.popularity),
      });
    }

    return {
      currentRole: currentPathwayRole,
      categories,
      totalAvailableRoles: pathwayRoles.length,
    };
  }

  // No current role - show all grouped by field
  const groupedByField = new Map<string, PathwayRole[]>();
  pathwayRoles.forEach((role) => {
    const existing = groupedByField.get(role.fieldTitle) || [];
    existing.push(role);
    groupedByField.set(role.fieldTitle, existing);
  });

  groupedByField.forEach((roles, fieldTitle) => {
    categories.push({
      title: fieldTitle,
      description: `${roles.length} Rollen verfügbar`,
      icon: '📁',
      roles: roles.map((role) => ({
        role,
        reason: `${role.level} Level`,
        skillGap: 0,
        isNextLogicalStep: false,
        isRecommended: false,
        popularity: popularityMap.get(role.id) || 0,
      })),
    });
  });

  return {
    currentRole: null,
    categories,
    totalAvailableRoles: pathwayRoles.length,
  };
}

/**
 * Estimate skill gap between two roles (0-100)
 */
function calculateEstimatedGap(fromRole: PathwayRole, toRole: PathwayRole): number {
  let gap = 0;

  // Level difference
  const levelDiff = toRole.levelOrder - fromRole.levelOrder;
  gap += levelDiff * 15;

  // Field change penalty
  if (fromRole.fieldId !== toRole.fieldId) {
    gap += 30;
  }

  // Leadership transition
  if (!fromRole.hasLeadership && toRole.hasLeadership) {
    gap += 20;
  }

  return Math.min(Math.max(gap, 0), 100);
}

// ============================================================================
// LEAD DASHBOARD ANALYTICS
// ============================================================================

export interface SkillTrend {
  skillId: string;
  skillName: string;
  competenceField: string;
  learnerCount: number;
  avgProgress: number;
  weeklyGrowth: number;
  isAIRelated: boolean;
}

export interface PathTransition {
  fromRole: string;
  toRole: string;
  count: number;
  avgDuration: number; // days
  successRate: number;
}

export interface TeamSkillGap {
  skillName: string;
  teamAvgLevel: number;
  requiredLevel: number;
  gapSize: number;
  criticalCount: number;
}

export interface LeadDashboardData {
  teamSize: number;
  activelearners: number;
  skillTrends: SkillTrend[];
  popularTransitions: PathTransition[];
  criticalGaps: TeamSkillGap[];
  aiToolsAdoption: {
    toolName: string;
    userCount: number;
    growthPercent: number;
  }[];
}

/**
 * Get analytics data for lead dashboard
 */
export async function getLeadDashboardData(leadUserId: string): Promise<LeadDashboardData> {
  // Get team members (users with learning plans)
  const teamMembers = await prisma.user.findMany({
    where: {
      LearningPlan: { isNot: null },
    },
    include: {
      LearningPlan: {
        include: {
          LearningFocus: {
            include: {
              Skill: { include: { CompetenceField: true } },
            },
          },
        },
      },
    },
  });

  const teamSize = teamMembers.length;
  const activeLearners = teamMembers.filter((m) =>
    m.LearningPlan?.LearningFocus.some((f) => f.status === 'IN_PROGRESS')
  ).length;

  // Calculate skill trends
  const skillLearnerMap = new Map<
    string,
    { skill: { id: string; title: string; field: string }; learners: number; levels: number[] }
  >();

  teamMembers.forEach((member) => {
    const plan = member.LearningPlan;
    if (!plan) return;

    plan.LearningFocus.forEach((focus) => {
      const existing = skillLearnerMap.get(focus.skillId) || {
        skill: {
          id: focus.Skill.id,
          title: focus.Skill.title,
          field: focus.Skill.CompetenceField.title,
        },
        learners: 0,
        levels: [],
      };
      existing.learners++;
      existing.levels.push(focus.currentLevel);
      skillLearnerMap.set(focus.skillId, existing);
    });
  });

  const aiKeywords = ['ai', 'claude', 'copilot', 'gpt', 'machine learning', 'automation', 'llm'];

  const skillTrends: SkillTrend[] = Array.from(skillLearnerMap.entries())
    .map(([skillId, data]) => ({
      skillId,
      skillName: data.skill.title,
      competenceField: data.skill.field,
      learnerCount: data.learners,
      avgProgress: data.levels.length > 0 ? data.levels.reduce((a, b) => a + b, 0) / data.levels.length : 0,
      weeklyGrowth: Math.random() * 20 - 5, // Placeholder - would need time-series data
      isAIRelated: aiKeywords.some((kw) => data.skill.title.toLowerCase().includes(kw)),
    }))
    .sort((a, b) => b.learnerCount - a.learnerCount)
    .slice(0, 10);

  // Get popular career transitions (using EXPLORING or COMMITTED status)
  const careerGoals = await prisma.careerGoal.findMany({
    where: { status: { in: ['EXPLORING', 'COMMITTED'] } },
    include: {
      Role: true,
      User: { select: { currentRoleId: true } },
    },
  });

  const transitionMap = new Map<string, { from: string; to: string; count: number }>();
  careerGoals.forEach((goal) => {
    if (goal.Role) {
      const key = `user_${goal.userId}|${goal.Role.title}`;
      const existing = transitionMap.get(key) || {
        from: 'Current Role',
        to: goal.Role.title,
        count: 0,
      };
      existing.count++;
      transitionMap.set(key, existing);
    }
  });

  const popularTransitions: PathTransition[] = Array.from(transitionMap.values())
    .map((t) => ({
      fromRole: t.from,
      toRole: t.to,
      count: t.count,
      avgDuration: 180 + Math.random() * 180, // Placeholder
      successRate: 0.7 + Math.random() * 0.25, // Placeholder
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate critical skill gaps
  const criticalGaps: TeamSkillGap[] = skillTrends
    .filter((s) => s.avgProgress < 2)
    .slice(0, 5)
    .map((s) => ({
      skillName: s.skillName,
      teamAvgLevel: s.avgProgress,
      requiredLevel: 3,
      gapSize: 3 - s.avgProgress,
      criticalCount: s.learnerCount,
    }));

  // AI tools adoption (placeholder data)
  const aiToolsAdoption = [
    { toolName: 'Claude Code', userCount: Math.floor(teamSize * 0.4), growthPercent: 85 },
    { toolName: 'GitHub Copilot', userCount: Math.floor(teamSize * 0.6), growthPercent: 45 },
    { toolName: 'Notion AI', userCount: Math.floor(teamSize * 0.3), growthPercent: 120 },
    { toolName: 'ChatGPT', userCount: Math.floor(teamSize * 0.7), growthPercent: 20 },
  ];

  return {
    teamSize,
    activelearners: activeLearners,
    skillTrends,
    popularTransitions,
    criticalGaps,
    aiToolsAdoption,
  };
}

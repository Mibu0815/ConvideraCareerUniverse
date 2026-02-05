"use server"

import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

// ─── Types ───────────────────────────────────────────────

export interface AdminAnalytics {
  // KPI Grid
  activeUsersCount: number
  totalUsersCount: number
  averageGapsPerUser: number
  top3TargetRoles: Array<{
    roleId: string
    roleName: string
    userCount: number
    percentage: number
  }>

  // Competence Field Heatmap
  competenceFieldHeatmap: Array<{
    fieldId: string
    fieldName: string
    fieldColor: string | null
    activeLearnersCount: number
    totalSkillsInTraining: number
    avgProgress: number
  }>

  // Modernization Check
  modernizationStats: {
    total2026Impulses: number
    totalCompletedImpulses: number
    aiToolImpulses: number
    cloudTechImpulses: number
    percentage: number
  }

  // Activity Summary
  recentActivity: {
    impulsesStartedToday: number
    impulsesCompletedToday: number
    impulsesStartedThisWeek: number
    impulsesCompletedThisWeek: number
  }
}

// ─── Main Analytics Query ────────────────────────────────

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  // Run queries in parallel for efficiency
  const [
    totalUsers,
    activeUsers,
    learningFocuses,
    targetRoleStats,
    competenceFieldData,
    impulseStats,
    activityToday,
    activityWeek,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Active users (have at least one IN_PROGRESS learning focus)
    prisma.user.count({
      where: {
        LearningPlan: {
          LearningFocus: {
            some: { status: 'IN_PROGRESS' },
          },
        },
      },
    }),

    // All learning focuses for gap calculation (via LearningPlan)
    prisma.learningFocus.findMany({
      select: {
        LearningPlan: { select: { userId: true } },
        gapSize: true,
      },
      where: {
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
      },
    }),

    // Target role statistics (from users' targetRoleId)
    prisma.user.groupBy({
      by: ['targetRoleId'],
      _count: { targetRoleId: true },
      where: { targetRoleId: { not: null } },
      orderBy: { _count: { targetRoleId: 'desc' } },
      take: 3,
    }),

    // Competence field training data
    prisma.competenceField.findMany({
      select: {
        id: true,
        title: true,
        color: true,
        LearningFocus: {
          where: { status: 'IN_PROGRESS' },
          select: {
            currentLevel: true,
            targetLevel: true,
          },
        },
      },
    }),

    // Impulse statistics for modernization check
    prisma.practicalImpulse.findMany({
      where: { isCompleted: true },
      select: {
        taskDescription: true,
        prompt: true,
      },
    }),

    // Today's activity
    prisma.activityLog.groupBy({
      by: ['activityType'],
      _count: { id: true },
      where: { createdAt: { gte: todayStart } },
    }),

    // This week's activity
    prisma.activityLog.groupBy({
      by: ['activityType'],
      _count: { id: true },
      where: { createdAt: { gte: weekStart } },
    }),
  ])

  // Calculate average gaps per user
  const gapsByUser = new Map<string, number[]>()
  learningFocuses.forEach((f) => {
    const userId = f.LearningPlan.userId
    const existing = gapsByUser.get(userId) || []
    existing.push(f.gapSize)
    gapsByUser.set(userId, existing)
  })

  let totalGaps = 0
  let userCount = 0
  gapsByUser.forEach((gaps) => {
    totalGaps += gaps.reduce((a, b) => a + b, 0)
    userCount++
  })
  const averageGapsPerUser = userCount > 0 ? totalGaps / userCount : 0

  // Get role names for top 3 target roles
  const roleIds = targetRoleStats.map((s) => s.targetRoleId).filter((id): id is string => id !== null)
  const roles = await prisma.role.findMany({
    where: { id: { in: roleIds } },
    select: { id: true, title: true },
  })
  const roleMap = new Map(roles.map((r) => [r.id, r.title]))

  const totalWithTargetRole = targetRoleStats.reduce((sum, s) => sum + s._count.targetRoleId, 0)
  const top3TargetRoles = targetRoleStats.map((s) => ({
    roleId: s.targetRoleId!,
    roleName: roleMap.get(s.targetRoleId!) || 'Unknown Role',
    userCount: s._count.targetRoleId,
    percentage: totalWithTargetRole > 0 ? (s._count.targetRoleId / totalWithTargetRole) * 100 : 0,
  }))

  // Calculate competence field heatmap
  const competenceFieldHeatmap = competenceFieldData
    .map((field) => {
      const activeCount = field.LearningFocus.length
      const totalProgress = field.LearningFocus.reduce(
        (sum, f) => sum + (f.currentLevel / f.targetLevel),
        0
      )
      return {
        fieldId: field.id,
        fieldName: field.title,
        fieldColor: field.color,
        activeLearnersCount: activeCount,
        totalSkillsInTraining: activeCount,
        avgProgress: activeCount > 0 ? (totalProgress / activeCount) * 100 : 0,
      }
    })
    .filter((f) => f.activeLearnersCount > 0)
    .sort((a, b) => b.activeLearnersCount - a.activeLearnersCount)

  // Modernization check - analyze impulse descriptions for 2026 tech keywords
  const aiKeywords = ['claude', 'copilot', 'gpt', 'ai', 'llm', 'machine learning', 'anthropic', 'cursor']
  const cloudKeywords = ['supabase', 'vercel', 'edge function', 'serverless', 'cloud', 'aws', 'netlify', 'docker']

  let aiToolImpulses = 0
  let cloudTechImpulses = 0

  impulseStats.forEach((impulse) => {
    const text = `${impulse.taskDescription || ''} ${impulse.prompt || ''}`.toLowerCase()

    if (aiKeywords.some((kw) => text.includes(kw))) {
      aiToolImpulses++
    }
    if (cloudKeywords.some((kw) => text.includes(kw))) {
      cloudTechImpulses++
    }
  })

  const total2026Impulses = new Set([
    ...impulseStats.filter((i) => {
      const text = `${i.taskDescription || ''} ${i.prompt || ''}`.toLowerCase()
      return aiKeywords.some((kw) => text.includes(kw)) || cloudKeywords.some((kw) => text.includes(kw))
    }),
  ]).size

  const totalCompletedImpulses = impulseStats.length

  // Parse activity logs
  const todayStarted = activityToday.find((a) => a.activityType === 'IMPULSE_STARTED')?._count.id || 0
  const todayCompleted = activityToday.find((a) => a.activityType === 'IMPULSE_COMPLETED')?._count.id || 0
  const weekStarted = activityWeek.find((a) => a.activityType === 'IMPULSE_STARTED')?._count.id || 0
  const weekCompleted = activityWeek.find((a) => a.activityType === 'IMPULSE_COMPLETED')?._count.id || 0

  return {
    activeUsersCount: activeUsers,
    totalUsersCount: totalUsers,
    averageGapsPerUser: Math.round(averageGapsPerUser * 10) / 10,
    top3TargetRoles,
    competenceFieldHeatmap,
    modernizationStats: {
      total2026Impulses,
      totalCompletedImpulses,
      aiToolImpulses,
      cloudTechImpulses,
      percentage: totalCompletedImpulses > 0 ? Math.round((total2026Impulses / totalCompletedImpulses) * 100) : 0,
    },
    recentActivity: {
      impulsesStartedToday: todayStarted,
      impulsesCompletedToday: todayCompleted,
      impulsesStartedThisWeek: weekStarted,
      impulsesCompletedThisWeek: weekCompleted,
    },
  }
}

// ─── Log Activity ────────────────────────────────────────

export async function logActivity(
  userId: string,
  activityType: 'IMPULSE_STARTED' | 'IMPULSE_COMPLETED' | 'SKILL_FOCUSED' | 'PLAN_CREATED' | 'EVIDENCE_SAVED',
  entityId?: string,
  entityName?: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.activityLog.create({
    data: {
      userId,
      activityType,
      entityId,
      entityName,
      metadata: metadata ?? Prisma.JsonNull,
    },
  })
}

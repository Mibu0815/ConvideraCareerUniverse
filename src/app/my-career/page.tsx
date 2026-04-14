import { Suspense } from "react"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/app/actions/user-sync"
import { getLearningRoadmap } from "@/app/actions/learning-journey"
import { Navigation } from "@/components/shared"
import { MyCareerView } from "@/components/my-career/MyCareerView"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Mein Karriereprofil | Career Universe",
  description: "Dein persönliches Karriere-Cockpit",
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-200" />
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded-lg" />
          <div className="h-6 w-96 bg-gray-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-2xl border border-gray-100" />
            <div className="h-28 bg-white rounded-2xl border border-gray-100" />
            <div className="h-28 bg-white rounded-2xl border border-gray-100" />
          </div>
          <div className="h-64 bg-white rounded-2xl border border-gray-100" />
          <div className="h-48 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  )
}

async function MyCareerContent({ userId, userName }: { userId: string; userName: string | null }) {
  const [user, roadmap, goals, recentActivity, skillAssessments] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        currentRoleId: true,
        targetRoleId: true,
        platformRole: true,
        createdAt: true,
      },
    }),
    getLearningRoadmap(userId),
    prisma.careerGoal.findMany({
      where: { userId },
      include: {
        Role: { select: { title: true, level: true } },
      },
      orderBy: { priority: "asc" },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        activityType: true,
        entityName: true,
        createdAt: true,
      },
    }),
    prisma.skillAssessment.findMany({
      where: { userId },
      include: {
        Skill: {
          select: {
            id: true,
            title: true,
            CompetenceField: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  // Fetch roles
  const [currentRole, targetRole] = await Promise.all([
    user.currentRoleId
      ? prisma.role.findUnique({
          where: { id: user.currentRoleId },
          select: { id: true, title: true, level: true },
        })
      : null,
    user.targetRoleId
      ? prisma.role.findUnique({
          where: { id: user.targetRoleId },
          select: { id: true, title: true, level: true },
        })
      : null,
  ])

  // Calculate completed skills count
  const completedSkillsCount = await prisma.learningFocus.count({
    where: {
      LearningPlan: { userId },
      status: "COMPLETED",
    },
  })

  // Get evidence counts per skill
  const evidenceCounts = await prisma.userSkillEvidence.groupBy({
    by: ["skillId"],
    where: { userId },
    _count: { id: true },
  })
  const evidenceMap = Object.fromEntries(
    evidenceCounts.map((e) => [e.skillId, e._count.id])
  )

  // Build skill portfolio grouped by competence field
  const skillsByField: Record<string, {
    fieldName: string
    skills: {
      id: string
      name: string
      selfLevel: number
      validatedLevel: number | null
      evidenceCount: number
      requiredLevel: number | null
    }[]
  }> = {}

  for (const sa of skillAssessments) {
    const fieldName = sa.Skill.CompetenceField?.title ?? "Sonstige"
    if (!skillsByField[fieldName]) {
      skillsByField[fieldName] = { fieldName, skills: [] }
    }
    // Find required level from roadmap
    const allGaps = [...roadmap.critical, ...roadmap.growth, ...roadmap.stretch]
    const gap = allGaps.find((g) => g.skillId === sa.skillId)

    skillsByField[fieldName].skills.push({
      id: sa.skillId,
      name: sa.Skill.title,
      selfLevel: sa.selfLevel,
      validatedLevel: sa.validatedLevel,
      evidenceCount: evidenceMap[sa.skillId] ?? 0,
      requiredLevel: gap?.requiredLevel ?? null,
    })
  }

  // Also add skills from roadmap that have no assessment yet
  const assessedIds = new Set(skillAssessments.map((sa) => sa.skillId))
  const allGaps = [...roadmap.critical, ...roadmap.growth, ...roadmap.stretch]
  for (const gap of allGaps) {
    if (!assessedIds.has(gap.skillId)) {
      const fieldName = gap.competenceFieldName ?? "Sonstige"
      if (!skillsByField[fieldName]) {
        skillsByField[fieldName] = { fieldName, skills: [] }
      }
      skillsByField[fieldName].skills.push({
        id: gap.skillId,
        name: gap.skillName,
        selfLevel: gap.currentLevel,
        validatedLevel: null,
        evidenceCount: evidenceMap[gap.skillId] ?? 0,
        requiredLevel: gap.requiredLevel,
      })
    }
  }

  const totalGaps = roadmap.meta.totalGaps
  const progressPercent = totalGaps > 0
    ? Math.round((completedSkillsCount / totalGaps) * 100)
    : 0

  return (
    <MyCareerView
      userName={userName}
      userEmail={user.email}
      memberSince={user.createdAt.toISOString()}
      currentRole={currentRole}
      targetRole={targetRole}
      progressPercent={progressPercent}
      totalGaps={totalGaps}
      completedSkillsCount={completedSkillsCount}
      criticalGaps={roadmap.critical.length}
      growthGaps={roadmap.growth.length}
      stretchGaps={roadmap.stretch.length}
      goals={goals.map((g) => ({
        id: g.id,
        roleTitle: g.Role.title,
        roleLevel: g.Role.level,
        status: g.status,
        notes: g.notes,
      }))}
      skillsByField={Object.values(skillsByField)}
      recentActivity={recentActivity.map((a) => ({
        id: a.id,
        action: a.activityType,
        details: a.entityName,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  )
}

export default async function MyCareerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <MyCareerContent userId={user.id} userName={user.name} />
    </Suspense>
  )
}

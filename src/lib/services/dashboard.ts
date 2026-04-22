'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/require-user'

// ─── Activity Streak ─────────────────────────────────────────────

export interface StreakDay {
  date: string                  // YYYY-MM-DD (local time)
  intensity: 0 | 1 | 2 | 3      // 0=nichts, 1=leicht, 2=Impuls/Evidence, 3=Validierung
  events: number
}

export interface StreakData {
  days: StreakDay[]             // 56 Einträge, chronologisch
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  lastActivityDate: string | null
}

const dateKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function getActivityStreak(): Promise<StreakData> {
  const user = await requireUser()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - 55)

  // ActivityLog: Tagesaktivität
  // Evidence (status=VALIDATED): hochwertige Tage (intensity 3)
  const [activityRows, validatedEvidence] = await Promise.all([
    prisma.activityLog.findMany({
      where: { userId: user.id, createdAt: { gte: start } },
      select: { createdAt: true, activityType: true },
    }),
    prisma.evidence.findMany({
      where: {
        userId: user.id,
        status: 'VALIDATED',
        validatedAt: { gte: start },
      },
      select: { validatedAt: true },
    }),
  ])

  const byDay = new Map<string, { intensity: number; events: number }>()

  for (const row of activityRows) {
    const key = dateKey(row.createdAt)
    const existing = byDay.get(key) ?? { intensity: 0, events: 0 }
    const intensity =
      row.activityType === 'IMPULSE_STARTED' ||
      row.activityType === 'IMPULSE_COMPLETED' ||
      row.activityType === 'EVIDENCE_SAVED'
        ? 2
        : 1 // SKILL_FOCUSED / PLAN_CREATED
    byDay.set(key, {
      intensity: Math.max(existing.intensity, intensity),
      events: existing.events + 1,
    })
  }

  for (const row of validatedEvidence) {
    if (!row.validatedAt) continue
    const key = dateKey(row.validatedAt)
    const existing = byDay.get(key) ?? { intensity: 0, events: 0 }
    byDay.set(key, {
      intensity: Math.max(existing.intensity, 3),
      events: existing.events + 1,
    })
  }

  const days: StreakDay[] = []
  for (let i = 0; i < 56; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const key = dateKey(d)
    const data = byDay.get(key) ?? { intensity: 0, events: 0 }
    days.push({
      date: key,
      intensity: data.intensity as 0 | 1 | 2 | 3,
      events: data.events,
    })
  }

  let currentStreak = 0
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].intensity > 0) currentStreak++
    else break
  }

  let longestStreak = 0
  let run = 0
  for (const d of days) {
    if (d.intensity > 0) {
      run++
      if (run > longestStreak) longestStreak = run
    } else {
      run = 0
    }
  }

  const totalActiveDays = days.filter(d => d.intensity > 0).length
  const lastActive = [...days].reverse().find(d => d.intensity > 0)

  return {
    days,
    currentStreak,
    longestStreak,
    totalActiveDays,
    lastActivityDate: lastActive?.date ?? null,
  }
}

// ─── Next-Step Suggestions ───────────────────────────────────────

export interface NextStep {
  id: string
  label: string
  description?: string
  href: string
  priority: 'primary' | 'secondary'
  icon: 'play' | 'pen' | 'clock' | 'award' | 'users'
}

export async function getNextStepSuggestions(): Promise<NextStep[]> {
  const user = await requireUser()
  const steps: NextStep[] = []

  // 1. Aktiver LearningFocus (in-progress) → Impuls fortsetzen
  const activeFocus = await prisma.learningFocus.findFirst({
    where: {
      LearningPlan: { userId: user.id },
      status: 'IN_PROGRESS',
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      Skill: { select: { title: true } },
    },
  })

  if (activeFocus) {
    const remaining = activeFocus.targetLevel - activeFocus.currentLevel
    steps.push({
      id: 'continue-impulse',
      label: 'Impuls fortsetzen',
      description: `${activeFocus.Skill.title} · L${activeFocus.currentLevel} → L${activeFocus.targetLevel}${remaining > 0 ? ` (${remaining} Level offen)` : ''}`,
      href: '/learning-journey',
      priority: 'primary',
      icon: 'play',
    })
  }

  // 2. Self-Assessed Evidences ohne Submission?
  const selfAssessedCount = await prisma.evidence.count({
    where: { userId: user.id, status: 'SELF_ASSESSED' },
  })

  if (selfAssessedCount > 0) {
    steps.push({
      id: 'submit-evidence',
      label: 'Evidence einreichen',
      description: `${selfAssessedCount} bereit für Validierung`,
      href: '/learning-journey',
      priority: 'secondary',
      icon: 'award',
    })
  }

  // 3. Reflexion heute? (kein ActivityLog-Eintrag IMPULSE_COMPLETED heute)
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const completedToday = await prisma.activityLog.findFirst({
    where: {
      userId: user.id,
      activityType: 'IMPULSE_COMPLETED',
      createdAt: { gte: startOfToday },
    },
  })

  if (!completedToday && activeFocus) {
    steps.push({
      id: 'reflection',
      label: '15 Min Reflexion',
      description: 'Rückblick auf den letzten Impuls',
      href: '/learning-journey',
      priority: 'secondary',
      icon: 'pen',
    })
  }

  // Fallback wenn nichts vorhanden
  if (steps.length === 0) {
    steps.push({
      id: 'explore',
      label: 'Rollen erkunden',
      description: 'Finde deinen nächsten Karriereschritt',
      href: '/my-career',
      priority: 'primary',
      icon: 'users',
    })
  }

  if (!steps.some(s => s.priority === 'primary')) {
    steps[0].priority = 'primary'
  }

  return steps.slice(0, 4)
}

// ─── Week Stats ──────────────────────────────────────────────────

export interface WeekStats {
  impulsesCompleted: number
  evidenceSubmitted: number
  validationsReceived: number
  periodStart: string
  periodEnd: string
}

export async function getWeekStats(): Promise<WeekStats> {
  const user = await requireUser()
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const [impulsesCompleted, evidenceSubmitted, validationsReceived] = await Promise.all([
    prisma.activityLog.count({
      where: {
        userId: user.id,
        activityType: 'IMPULSE_COMPLETED',
        createdAt: { gte: weekStart },
      },
    }),
    prisma.evidence.count({
      where: {
        userId: user.id,
        status: { in: ['EVIDENCE_SUBMITTED', 'VALIDATED'] },
        createdAt: { gte: weekStart },
      },
    }),
    prisma.validationEvent.count({
      where: {
        evidence: { userId: user.id },
        toStatus: 'VALIDATED',
        createdAt: { gte: weekStart },
      },
    }),
  ])

  return {
    impulsesCompleted,
    evidenceSubmitted,
    validationsReceived,
    periodStart: weekStart.toISOString(),
    periodEnd: now.toISOString(),
  }
}

// ─── Path Snapshot ───────────────────────────────────────────────

export interface PathSnapshot {
  currentRoleTitle: string | null
  currentRoleLevel: string | null
  targetRoleTitle: string | null
  targetRoleLevel: string | null
  skillsValidatedCount: number
  skillsRequiredCount: number
}

export async function getPathSnapshot(): Promise<PathSnapshot | null> {
  const user = await requireUser()

  const [currentRole, careerGoal] = await Promise.all([
    user.currentRoleId
      ? prisma.role.findUnique({
          where: { id: user.currentRoleId },
          select: { title: true, level: true },
        })
      : null,
    prisma.careerGoal.findFirst({
      where: { userId: user.id, status: 'COMMITTED' },
      include: {
        Role: {
          select: {
            title: true,
            level: true,
            RoleSkill: { select: { skillId: true } },
          },
        },
      },
      orderBy: { priority: 'asc' },
    }),
  ])

  if (!currentRole && !careerGoal) return null

  const skillsRequiredCount = careerGoal?.Role.RoleSkill.length ?? 0

  const skillsValidatedCount =
    careerGoal && skillsRequiredCount > 0
      ? await prisma.evidence.count({
          where: {
            userId: user.id,
            status: 'VALIDATED',
            skillId: { in: careerGoal.Role.RoleSkill.map(rs => rs.skillId) },
          },
        })
      : 0

  return {
    currentRoleTitle: currentRole?.title ?? null,
    currentRoleLevel: currentRole?.level ?? null,
    targetRoleTitle: careerGoal?.Role.title ?? null,
    targetRoleLevel: careerGoal?.Role.level ?? null,
    skillsValidatedCount,
    skillsRequiredCount,
  }
}

// ─── Admin Responsibilities ──────────────────────────────────────

export interface AdminResponsibilities {
  pendingValidations: number
  competenceFieldsWithoutOwner: number
  usersWithoutRole: number
}

export async function getAdminResponsibilities(): Promise<AdminResponsibilities | null> {
  const user = await requireUser()
  if (user.platformRole !== 'ADMIN' && user.platformRole !== 'FUNCTIONAL_LEAD') {
    return null
  }

  const isAdminUser = user.platformRole === 'ADMIN'

  const [pendingValidations, competenceFieldsWithoutOwner, usersWithoutRole] = await Promise.all([
    prisma.evidence.count({
      where: { status: 'EVIDENCE_SUBMITTED' },
    }),
    isAdminUser
      ? prisma.competenceField.count({ where: { ownerId: null } })
      : Promise.resolve(0),
    isAdminUser
      ? prisma.user.count({ where: { currentRoleId: null } })
      : Promise.resolve(0),
  ])

  return {
    pendingValidations,
    competenceFieldsWithoutOwner,
    usersWithoutRole,
  }
}

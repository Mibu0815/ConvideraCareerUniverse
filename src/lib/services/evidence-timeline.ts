'use server'

import { prisma } from '@/lib/prisma'
import { AssessmentStatus, AssessmentType, PlatformRole } from '@prisma/client'
import { requireUser } from '@/lib/auth/require-user'

// Alle Timeline-Events eines Users, nach Monat (YYYY-MM) gruppiert
export async function getTimeline(userId: string) {
  const user = await requireUser()
  if (user.id !== userId && user.platformRole === PlatformRole.USER) {
    throw new Error('Unauthorized')
  }

  const events = await prisma.timelineEvent.findMany({
    where: { userId },
    include: {
      evidence: {
        include: {
          skill: { include: { CompetenceField: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const grouped = events.reduce((acc, event) => {
    const key = event.createdAt.toISOString().slice(0, 7)
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return grouped
}

// Evidence für einen Skill einreichen
export async function submitEvidence(input: {
  skillId: string
  title: string
  description: string
  evidenceUrl?: string
  selfLevel: number
}) {
  const user = await requireUser()

  const evidence = await prisma.$transaction(async (tx) => {
    const ev = await tx.evidence.create({
      data: {
        userId: user.id,
        skillId: input.skillId,
        title: input.title,
        description: input.description,
        evidenceUrl: input.evidenceUrl,
        selfLevel: input.selfLevel,
        status: AssessmentStatus.EVIDENCE_SUBMITTED,
      },
    })

    await tx.timelineEvent.create({
      data: {
        userId: user.id,
        evidenceId: ev.id,
        eventType: 'EVIDENCE_SUBMITTED',
        title: `Evidence eingereicht: ${input.title}`,
        metadata: { skillId: input.skillId, level: input.selfLevel },
      },
    })

    await tx.skillAssessment.upsert({
      where: { userId_skillId: { userId: user.id, skillId: input.skillId } },
      update: { selfLevel: input.selfLevel },
      create: {
        userId: user.id,
        skillId: input.skillId,
        selfLevel: input.selfLevel,
      },
    })

    await tx.assessmentHistory.create({
      data: {
        userId: user.id,
        skillId: input.skillId,
        level: input.selfLevel,
        type: AssessmentType.SELF,
        assessedById: user.id,
      },
    })

    return ev
  })

  return evidence
}

// Evidence durch Functional Lead / Admin validieren
export async function validateEvidence(input: {
  evidenceId: string
  validatedLevel: number
  comment?: string
}) {
  const validator = await requireUser()

  if (validator.platformRole === PlatformRole.USER) {
    throw new Error('Nur Functional Leads und Admins können validieren')
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id: input.evidenceId },
    include: { skill: true },
  })
  if (!evidence) throw new Error('Evidence nicht gefunden')
  if (evidence.userId === validator.id) throw new Error('Keine Selbst-Validierung')

  await prisma.$transaction(async (tx) => {
    await tx.evidence.update({
      where: { id: input.evidenceId },
      data: {
        status: AssessmentStatus.VALIDATED,
        validatedLevel: input.validatedLevel,
        validatedById: validator.id,
        validatedAt: new Date(),
      },
    })

    await tx.validationEvent.create({
      data: {
        evidenceId: input.evidenceId,
        validatorId: validator.id,
        fromStatus: evidence.status,
        toStatus: AssessmentStatus.VALIDATED,
        comment: input.comment,
      },
    })

    await tx.skillAssessment.update({
      where: {
        userId_skillId: { userId: evidence.userId, skillId: evidence.skillId },
      },
      data: { validatedLevel: input.validatedLevel },
    })

    await tx.assessmentHistory.create({
      data: {
        userId: evidence.userId,
        skillId: evidence.skillId,
        level: input.validatedLevel,
        type: AssessmentType.VALIDATED,
        assessedById: validator.id,
      },
    })

    await tx.timelineEvent.create({
      data: {
        userId: evidence.userId,
        evidenceId: input.evidenceId,
        eventType: 'SKILL_VALIDATED',
        title: `${evidence.skill.title} auf Level ${input.validatedLevel} validiert`,
        metadata: {
          validatorId: validator.id,
          level: input.validatedLevel,
          comment: input.comment,
        },
      },
    })
  })
}

// Alle offenen Evidence-Einreichungen
export async function getPendingValidations() {
  const user = await requireUser()
  if (user.platformRole === PlatformRole.USER) throw new Error('Unauthorized')

  return prisma.evidence.findMany({
    where: { status: AssessmentStatus.EVIDENCE_SUBMITTED },
    include: {
      user: { select: { id: true, email: true, name: true } },
      skill: { include: { CompetenceField: true } },
      validationEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
  })
}

// Tooltip-Daten für einen Skill (Hover-Kontext)
export async function getSkillTooltipData(skillId: string, userId: string) {
  const [assessment, history, latestEvidence] = await Promise.all([
    prisma.skillAssessment.findUnique({
      where: { userId_skillId: { userId, skillId } },
    }),
    prisma.assessmentHistory.findMany({
      where: { userId, skillId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    }),
    prisma.evidence.findFirst({
      where: { userId, skillId },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { assessment, history, latestEvidence }
}

// Export-Daten für PDF (alle validierten Skills)
export async function getTimelineExportData(userId: string) {
  const user = await requireUser()
  if (user.id !== userId && user.platformRole === PlatformRole.USER) {
    throw new Error('Unauthorized')
  }

  return prisma.evidence.findMany({
    where: { userId, status: AssessmentStatus.VALIDATED },
    include: {
      skill: { include: { CompetenceField: true } },
      validatedBy: { select: { name: true, email: true } },
      validationEvents: true,
    },
    orderBy: { validatedAt: 'desc' },
  })
}

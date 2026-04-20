'use server';

// Assessment write helpers with append-only audit trail.
// All SkillAssessment mutations must go through these functions
// to ensure an AssessmentHistory record is created atomically.

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

/**
 * Upsert a self-assessment and record an audit trail entry.
 */
export async function upsertSelfAssessment(
  userId: string,
  skillId: string,
  selfLevel: number,
  notes?: string
) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.skillAssessment.upsert({
      where: { userId_skillId: { userId, skillId } },
      create: { userId, skillId, selfLevel, notes },
      update: { selfLevel, notes },
    });

    await tx.assessmentHistory.create({
      data: {
        userId,
        skillId,
        level: selfLevel,
        type: 'SELF',
      },
    });

    return assessment;
  });
}

/**
 * Record a validated level from a Functional Lead and create an audit trail entry.
 */
export async function validateAssessment(
  userId: string,
  skillId: string,
  validatedLevel: number,
  validatorId: string,
  notes?: string
) {
  const prisma = await getPrisma();

  return prisma.$transaction(async (tx) => {
    const assessment = await tx.skillAssessment.update({
      where: { userId_skillId: { userId, skillId } },
      data: { validatedLevel, notes },
    });

    await tx.assessmentHistory.create({
      data: {
        userId,
        skillId,
        level: validatedLevel,
        type: 'VALIDATED',
        assessedById: validatorId,
      },
    });

    return assessment;
  });
}

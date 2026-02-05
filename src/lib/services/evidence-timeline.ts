// src/lib/services/evidence-timeline.ts
// Evidence-Timeline & Objective Skill Validation System

import type {
  EvidenceType,
  ValidationStatus,
  UserSkillEvidence,
  TimelineEntry,
  User,
  Skill,
} from '@prisma/client';

// Lazy import prisma to prevent initialization during build
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// ============================================
// Types & Interfaces
// ============================================

export interface EvidenceSubmission {
  skillId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  url?: string;
  issuer?: string;
  issuedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  status: ValidationStatus;
  score: number;
  notes: string;
  autoValidated: boolean;
}

export interface SkillProgress {
  skillId: string;
  skillName: string;
  competenceField: string;
  currentLevel: number;
  targetLevel: number;
  totalPoints: number;
  pointsToNextLevel: number;
  evidenceCount: number;
  verifiedEvidenceCount: number;
  recentEvidence: EvidenceSummary[];
}

export interface EvidenceSummary {
  id: string;
  type: EvidenceType;
  title: string;
  status: ValidationStatus;
  contribution: number;
  issuedAt: Date | null;
  createdAt: Date;
}

export interface TimelineView {
  entries: TimelineEntryView[];
  totalSkillsTracked: number;
  totalEvidenceSubmitted: number;
  totalVerified: number;
  averageLevel: number;
}

export interface TimelineEntryView {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  skillName?: string;
  beforeLevel?: number;
  afterLevel?: number;
  eventDate: Date;
  evidenceItems: EvidenceSummary[];
}

// ============================================
// Evidence Type Weights & Level Thresholds
// ============================================

const DEFAULT_EVIDENCE_WEIGHTS: Record<EvidenceType, number> = {
  CERTIFICATION: 25,
  PROJECT: 20,
  CODE_CONTRIBUTION: 15,
  PEER_REVIEW: 12,
  ASSESSMENT: 22,
  COURSE_COMPLETION: 10,
  PUBLICATION: 18,
  MENTORING: 15,
};

const LEVEL_THRESHOLDS = {
  1: 0,    // Learner: 0+ points
  2: 25,   // Practitioner: 25+ points
  3: 60,   // Professional: 60+ points
  4: 100,  // Master: 100+ points
};

const AUTO_VALIDATE_DOMAINS = [
  'credly.com',
  'credential.net',
  'coursera.org',
  'udemy.com',
  'linkedin.com/learning',
  'aws.amazon.com',
  'cloud.google.com',
  'learn.microsoft.com',
];

// ============================================
// Core Functions
// ============================================

/**
 * Submit new skill evidence for a user
 */
export async function submitEvidence(
  userId: string,
  submission: EvidenceSubmission
): Promise<UserSkillEvidence> {
  const prisma = await getPrisma();

  // Auto-validate if URL matches known certification providers
  const validation = submission.url
    ? autoValidateUrl(submission.url, submission.type)
    : { status: 'PENDING' as ValidationStatus, score: 0, notes: '', autoValidated: false };

  // Calculate skill level contribution based on evidence type
  const basePoints = DEFAULT_EVIDENCE_WEIGHTS[submission.type];
  const contribution = validation.status === 'VERIFIED' ? basePoints : 0;

  const evidence = await prisma.userSkillEvidence.create({
    data: {
      id: `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      skillId: submission.skillId,
      type: submission.type,
      title: submission.title,
      description: submission.description,
      url: submission.url,
      issuer: submission.issuer,
      issuedAt: submission.issuedAt,
      expiresAt: submission.expiresAt,
      metadata: submission.metadata as never,
      status: validation.status,
      validationScore: validation.score,
      validationNotes: validation.notes,
      validatedAt: validation.autoValidated ? new Date() : null,
      validatedBy: validation.autoValidated ? 'SYSTEM_AUTO' : null,
      skillLevelContribution: contribution,
      updatedAt: new Date(),
    },
  });

  // If auto-validated, create timeline entry and check for level up
  if (validation.autoValidated) {
    await checkAndCreateLevelUpEntry(userId, submission.skillId);
  }

  return evidence;
}

/**
 * Auto-validate evidence URL against known providers
 */
function autoValidateUrl(url: string, type: EvidenceType): ValidationResult {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    const isKnownProvider = AUTO_VALIDATE_DOMAINS.some((domain) =>
      hostname.includes(domain.replace('www.', ''))
    );

    if (isKnownProvider && type === 'CERTIFICATION') {
      return {
        status: 'VERIFIED',
        score: 95,
        notes: `Auto-validated via ${hostname}`,
        autoValidated: true,
      };
    }

    if (isKnownProvider && type === 'COURSE_COMPLETION') {
      return {
        status: 'VERIFIED',
        score: 90,
        notes: `Auto-validated course completion from ${hostname}`,
        autoValidated: true,
      };
    }

    // GitHub contributions can be partially auto-validated
    if (hostname.includes('github.com') && type === 'CODE_CONTRIBUTION') {
      return {
        status: 'VERIFIED',
        score: 85,
        notes: 'GitHub contribution verified via URL',
        autoValidated: true,
      };
    }
  } catch {
    // Invalid URL, manual validation required
  }

  return {
    status: 'PENDING',
    score: 0,
    notes: 'Manual validation required',
    autoValidated: false,
  };
}

/**
 * Manually validate evidence (admin/reviewer function)
 */
export async function validateEvidence(
  evidenceId: string,
  reviewerId: string,
  approved: boolean,
  notes?: string
): Promise<UserSkillEvidence> {
  const prisma = await getPrisma();

  const evidence = await prisma.userSkillEvidence.findUnique({
    where: { id: evidenceId },
  });

  if (!evidence) {
    throw new Error(`Evidence not found: ${evidenceId}`);
  }

  const basePoints = DEFAULT_EVIDENCE_WEIGHTS[evidence.type];
  const contribution = approved ? basePoints : 0;

  const updated = await prisma.userSkillEvidence.update({
    where: { id: evidenceId },
    data: {
      status: approved ? 'VERIFIED' : 'REJECTED',
      validatedAt: new Date(),
      validatedBy: reviewerId,
      validationScore: approved ? 100 : 0,
      validationNotes: notes || (approved ? 'Manually verified' : 'Rejected by reviewer'),
      skillLevelContribution: contribution,
    },
  });

  // Check for level up if approved
  if (approved) {
    await checkAndCreateLevelUpEntry(evidence.userId, evidence.skillId);
  }

  return updated;
}

/**
 * Check if user has leveled up and create timeline entry
 */
async function checkAndCreateLevelUpEntry(
  userId: string,
  skillId: string
): Promise<TimelineEntry | null> {
  const prisma = await getPrisma();

  // Get all verified evidence for this skill
  const evidences = await prisma.userSkillEvidence.findMany({
    where: {
      userId,
      skillId,
      status: 'VERIFIED',
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalPoints = evidences.reduce((sum, e) => sum + e.skillLevelContribution, 0);
  const currentLevel = calculateLevelFromPoints(totalPoints);

  // Get the last timeline entry for this skill to compare levels
  const lastEntry = await prisma.timelineEntry.findFirst({
    where: {
      userId,
      skillId,
      eventType: 'skill_level_up',
    },
    orderBy: { eventDate: 'desc' },
  });

  const previousLevel = lastEntry?.afterLevel ?? 0;

  // Create level up entry if level increased
  if (currentLevel > previousLevel) {
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: { CompetenceField: true },
    });

    return prisma.timelineEntry.create({
      data: {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        skillId,
        eventType: 'skill_level_up',
        title: `${skill?.title || 'Skill'} - Level ${currentLevel}`,
        description: `Advanced from Level ${previousLevel} to Level ${currentLevel} in ${skill?.CompetenceField.title || 'skill area'}`,
        beforeLevel: previousLevel,
        afterLevel: currentLevel,
        evidenceIds: evidences.slice(0, 5).map((e) => e.id),
      },
    });
  }

  return null;
}

/**
 * Calculate skill level from total points
 */
function calculateLevelFromPoints(points: number): number {
  if (points >= LEVEL_THRESHOLDS[4]) return 4;
  if (points >= LEVEL_THRESHOLDS[3]) return 3;
  if (points >= LEVEL_THRESHOLDS[2]) return 2;
  if (points >= LEVEL_THRESHOLDS[1]) return 1;
  return 0;
}

/**
 * Get points needed for next level
 */
function getPointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevelFromPoints(currentPoints);
  if (currentLevel >= 4) return 0;

  const nextLevelThreshold = LEVEL_THRESHOLDS[(currentLevel + 1) as keyof typeof LEVEL_THRESHOLDS];
  return Math.max(0, nextLevelThreshold - currentPoints);
}

/**
 * Get user's skill progress for all skills with evidence
 */
export async function getUserSkillProgress(userId: string): Promise<SkillProgress[]> {
  const prisma = await getPrisma();

  // Get all evidence grouped by skill
  const evidences = await prisma.userSkillEvidence.findMany({
    where: { userId },
    include: {
      Skill: {
        include: { CompetenceField: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Group by skill
  type EvidenceWithSkill = typeof evidences[number];
  const skillMap = new Map<string, EvidenceWithSkill[]>();
  for (const ev of evidences) {
    if (!skillMap.has(ev.skillId)) {
      skillMap.set(ev.skillId, []);
    }
    skillMap.get(ev.skillId)!.push(ev);
  }

  const progress: SkillProgress[] = [];

  for (const [skillId, skillEvidences] of skillMap) {
    const skill = skillEvidences[0].Skill;
    const verifiedEvidences = skillEvidences.filter((e) => e.status === 'VERIFIED');
    const totalPoints = verifiedEvidences.reduce((sum, e) => sum + e.skillLevelContribution, 0);
    const currentLevel = calculateLevelFromPoints(totalPoints);

    progress.push({
      skillId,
      skillName: skill.title,
      competenceField: skill.CompetenceField.title,
      currentLevel,
      targetLevel: 4,
      totalPoints,
      pointsToNextLevel: getPointsToNextLevel(totalPoints),
      evidenceCount: skillEvidences.length,
      verifiedEvidenceCount: verifiedEvidences.length,
      recentEvidence: skillEvidences.slice(0, 3).map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        status: e.status,
        contribution: e.skillLevelContribution,
        issuedAt: e.issuedAt,
        createdAt: e.createdAt,
      })),
    });
  }

  return progress.sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Get user's timeline view
 */
export async function getUserTimeline(
  userId: string,
  options?: { limit?: number; offset?: number; skillId?: string }
): Promise<TimelineView> {
  const prisma = await getPrisma();

  const where = {
    userId,
    ...(options?.skillId && { skillId: options.skillId }),
  };

  const entries = await prisma.timelineEntry.findMany({
    where,
    orderBy: { eventDate: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });

  // Get related evidences
  const allEvidenceIds = entries.flatMap((e) => e.evidenceIds);
  const evidences = await prisma.userSkillEvidence.findMany({
    where: { id: { in: allEvidenceIds } },
    include: { Skill: true },
  });

  const evidenceMap = new Map(evidences.map((e) => [e.id, e]));

  // Get skill names for entries
  const skillIds = entries.filter((e) => e.skillId).map((e) => e.skillId!);
  const skills = await prisma.skill.findMany({
    where: { id: { in: skillIds } },
  });
  const skillMap = new Map(skills.map((s) => [s.id, s]));

  // Calculate aggregates
  const allEvidences = await prisma.userSkillEvidence.findMany({
    where: { userId },
  });

  const uniqueSkills = new Set(allEvidences.map((e) => e.skillId));
  const verifiedCount = allEvidences.filter((e) => e.status === 'VERIFIED').length;
  const totalPoints = allEvidences
    .filter((e) => e.status === 'VERIFIED')
    .reduce((sum, e) => sum + e.skillLevelContribution, 0);

  const timelineEntryViews: TimelineEntryView[] = entries.map((entry) => ({
    id: entry.id,
    eventType: entry.eventType,
    title: entry.title,
    description: entry.description,
    skillName: entry.skillId ? skillMap.get(entry.skillId)?.title : undefined,
    beforeLevel: entry.beforeLevel ?? undefined,
    afterLevel: entry.afterLevel ?? undefined,
    eventDate: entry.eventDate,
    evidenceItems: entry.evidenceIds
      .map((id) => {
        const ev = evidenceMap.get(id);
        if (!ev) return null;
        return {
          id: ev.id,
          type: ev.type,
          title: ev.title,
          status: ev.status,
          contribution: ev.skillLevelContribution,
          issuedAt: ev.issuedAt,
          createdAt: ev.createdAt,
        };
      })
      .filter((x): x is EvidenceSummary => x !== null),
  }));

  return {
    entries: timelineEntryViews,
    totalSkillsTracked: uniqueSkills.size,
    totalEvidenceSubmitted: allEvidences.length,
    totalVerified: verifiedCount,
    averageLevel:
      uniqueSkills.size > 0
        ? Math.round(
            (totalPoints / uniqueSkills.size / LEVEL_THRESHOLDS[4]) * 4 * 10
          ) / 10
        : 0,
  };
}

/**
 * Get evidence pending validation
 */
export async function getPendingEvidence(options?: {
  limit?: number;
  offset?: number;
}): Promise<UserSkillEvidence[]> {
  const prisma = await getPrisma();

  return prisma.userSkillEvidence.findMany({
    where: { status: 'PENDING' },
    include: {
      User: true,
      Skill: { include: { CompetenceField: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get or create user by email
 */
export async function getOrCreateUser(email: string, name?: string): Promise<User> {
  const prisma = await getPrisma();

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      updatedAt: new Date(),
    },
  });
}

/**
 * Compare user's validated skills against target role
 */
export async function compareUserToRole(
  userId: string,
  targetRoleId: string
): Promise<{
  roleRequirements: Array<{
    skillId: string;
    skillName: string;
    requiredLevel: number;
    userLevel: number;
    gap: number;
    status: 'met' | 'partial' | 'missing';
  }>;
  overallReadiness: number;
  missingSkills: string[];
  partialSkills: string[];
  metSkills: string[];
}> {
  const prisma = await getPrisma();

  // Get target role skills
  const roleSkills = await prisma.roleSkill.findMany({
    where: { roleId: targetRoleId },
    include: { Skill: true },
  });

  // Get user's skill progress
  const userProgress = await getUserSkillProgress(userId);
  const userSkillMap = new Map(userProgress.map((p) => [p.skillId, p]));

  const requirements = roleSkills.map((rs) => {
    const userSkill = userSkillMap.get(rs.skillId);
    const userLevel = userSkill?.currentLevel ?? 0;
    const gap = Math.max(0, rs.minLevel - userLevel);

    let status: 'met' | 'partial' | 'missing';
    if (userLevel >= rs.minLevel) {
      status = 'met';
    } else if (userLevel > 0) {
      status = 'partial';
    } else {
      status = 'missing';
    }

    return {
      skillId: rs.skillId,
      skillName: rs.Skill.title,
      requiredLevel: rs.minLevel,
      userLevel,
      gap,
      status,
    };
  });

  const metSkills = requirements.filter((r) => r.status === 'met').map((r) => r.skillName);
  const partialSkills = requirements.filter((r) => r.status === 'partial').map((r) => r.skillName);
  const missingSkills = requirements.filter((r) => r.status === 'missing').map((r) => r.skillName);

  const totalRequired = requirements.reduce((sum, r) => sum + r.requiredLevel, 0);
  const totalAchieved = requirements.reduce(
    (sum, r) => sum + Math.min(r.userLevel, r.requiredLevel),
    0
  );
  const overallReadiness = totalRequired > 0 ? Math.round((totalAchieved / totalRequired) * 100) : 0;

  return {
    roleRequirements: requirements,
    overallReadiness,
    missingSkills,
    partialSkills,
    metSkills,
  };
}

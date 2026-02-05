// src/lib/services/career-logic.ts

// Lazy import prisma to prevent initialization during build
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export interface SkillComparison {
  skillId: string;
  skillName: string;
  skillSlug: string;
  competenceFieldId: string;
  competenceFieldName: string;
  competenceFieldColor: string | null;
  fromLevel: number;
  toLevel: number;
  delta: number;
  isNew: boolean;
  isRemoved: boolean;
}

export interface ResponsibilityDiff {
  id: string;
  text: string;
  category: string | null;
  status: 'added' | 'removed' | 'unchanged' | 'modified';
  similarity?: number;
}

export interface SoftSkillComparison {
  id: string;
  name: string;
  category: string | null;
  status: 'added' | 'removed' | 'unchanged';
}

export interface RadarChartData {
  competenceField: string;
  competenceFieldId: string;
  color: string;
  fromRole: number;
  toRole: number;
  maxLevel: number;
  skills: {
    name: string;
    fromLevel: number;
    toLevel: number;
  }[];
}

export interface RoleComparisonResult {
  fromRole: {
    id: string;
    name: string;
    level: string;
    leadershipType: string;
    team: string | null;
  } | null;
  toRole: {
    id: string;
    name: string;
    level: string;
    leadershipType: string;
    hasBudgetAuth: boolean;
    team: string | null;
    reportsTo: string | null;
  };
  skillComparisons: SkillComparison[];
  radarChartData: RadarChartData[];
  responsibilityDiff: ResponsibilityDiff[];
  softSkillComparisons: SoftSkillComparison[];
  summary: {
    totalSkillUpgrades: number;
    totalNewSkills: number;
    totalRemovedSkills: number;
    newResponsibilities: number;
    removedResponsibilities: number;
    leadershipChange: 'none' | 'gained' | 'upgraded' | 'lost';
    averageLevelIncrease: number;
  };
}

export async function compareRoles(
  fromRoleId: string | null,
  toRoleId: string
): Promise<RoleComparisonResult> {
  const prisma = await getPrisma();
  const toRole = await prisma.role.findUnique({
    where: { id: toRoleId },
    include: {
      OccupationalField: true,
      RoleSkill: {
        include: {
          Skill: {
            include: {
              CompetenceField: true,
            },
          },
        },
      },
      SoftSkill: true,
      Responsibility: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!toRole) {
    throw new Error(`Target role not found: ${toRoleId}`);
  }

  let fromRole = null;
  const fromRoleSkillsMap = new Map<string, { level: number; skillId: string }>();
  const fromResponsibilities: { id: string; text: string; category: string | null }[] = [];
  const fromSoftSkills = new Set<string>();

  if (fromRoleId) {
    fromRole = await prisma.role.findUnique({
      where: { id: fromRoleId },
      include: {
        OccupationalField: true,
        RoleSkill: {
          include: {
            Skill: {
              include: {
                CompetenceField: true,
              },
            },
          },
        },
        SoftSkill: true,
        Responsibility: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (fromRole) {
      fromRole.RoleSkill.forEach((rs) => {
        fromRoleSkillsMap.set(rs.skillId, { level: rs.minLevel, skillId: rs.skillId });
      });
      fromRole.Responsibility.forEach((r) => {
        fromResponsibilities.push({ id: r.id, text: r.text, category: r.category ?? null });
      });
      fromRole.SoftSkill.forEach((ss) => {
        fromSoftSkills.add(ss.id);
      });
    }
  }

  const skillComparisons: SkillComparison[] = [];
  const competenceFieldAggregation = new Map<
    string,
    {
      id: string;
      name: string;
      color: string | null;
      fromLevels: number[];
      toLevels: number[];
      skills: { name: string; fromLevel: number; toLevel: number }[];
    }
  >();

  const processedSkillIds = new Set<string>();

  for (const toRoleSkill of toRole.RoleSkill) {
    const skill = toRoleSkill.Skill;
    const cf = skill.CompetenceField;
    processedSkillIds.add(skill.id);

    const fromLevel = fromRoleSkillsMap.get(skill.id)?.level ?? 0;
    const toLevel = toRoleSkill.minLevel;

    skillComparisons.push({
      skillId: skill.id,
      skillName: skill.title,
      skillSlug: skill.slug,
      competenceFieldId: cf.id,
      competenceFieldName: cf.title,
      competenceFieldColor: cf.color,
      fromLevel,
      toLevel,
      delta: toLevel - fromLevel,
      isNew: fromLevel === 0,
      isRemoved: false,
    });

    if (!competenceFieldAggregation.has(cf.id)) {
      competenceFieldAggregation.set(cf.id, {
        id: cf.id,
        name: cf.title,
        color: cf.color,
        fromLevels: [],
        toLevels: [],
        skills: [],
      });
    }
    const cfData = competenceFieldAggregation.get(cf.id)!;
    cfData.fromLevels.push(fromLevel);
    cfData.toLevels.push(toLevel);
    cfData.skills.push({ name: skill.title, fromLevel, toLevel });
  }

  if (fromRole) {
    for (const fromRoleSkill of fromRole.RoleSkill) {
      if (!processedSkillIds.has(fromRoleSkill.skillId)) {
        const skill = fromRoleSkill.Skill;
        const cf = skill.CompetenceField;

        skillComparisons.push({
          skillId: skill.id,
          skillName: skill.title,
          skillSlug: skill.slug,
          competenceFieldId: cf.id,
          competenceFieldName: cf.title,
          competenceFieldColor: cf.color,
          fromLevel: fromRoleSkill.minLevel,
          toLevel: 0,
          delta: -fromRoleSkill.minLevel,
          isNew: false,
          isRemoved: true,
        });
      }
    }
  }

  const radarChartData: RadarChartData[] = Array.from(competenceFieldAggregation.values()).map(
    (cf) => ({
      competenceField: cf.name,
      competenceFieldId: cf.id,
      color: cf.color || '#6366f1',
      fromRole: average(cf.fromLevels),
      toRole: average(cf.toLevels),
      maxLevel: 4,
      skills: cf.skills,
    })
  );

  const responsibilityDiff = calculateResponsibilityDiff(
    fromResponsibilities,
    toRole.Responsibility.map((r) => ({ id: r.id, text: r.text, category: r.category ?? null }))
  );

  const softSkillComparisons: SoftSkillComparison[] = [];
  const processedSoftSkillIds = new Set<string>();

  for (const ss of toRole.SoftSkill) {
    processedSoftSkillIds.add(ss.id);

    softSkillComparisons.push({
      id: ss.id,
      name: ss.title,
      category: ss.category,
      status: fromSoftSkills.has(ss.id) ? 'unchanged' : 'added',
    });
  }

  if (fromRole) {
    for (const ss of fromRole.SoftSkill) {
      if (!processedSoftSkillIds.has(ss.id)) {
        softSkillComparisons.push({
          id: ss.id,
          name: ss.title,
          category: ss.category,
          status: 'removed',
        });
      }
    }
  }

  const skillUpgrades = skillComparisons.filter((s) => s.delta > 0 && !s.isNew);
  const newSkills = skillComparisons.filter((s) => s.isNew);
  const removedSkills = skillComparisons.filter((s) => s.isRemoved);
  const addedResponsibilities = responsibilityDiff.filter((r) => r.status === 'added');
  const removedResponsibilities = responsibilityDiff.filter((r) => r.status === 'removed');

  let leadershipChange: 'none' | 'gained' | 'upgraded' | 'lost' = 'none';
  const fromLeadership = fromRole?.leadershipType ?? 'NONE';
  const toLeadership = toRole.leadershipType ?? 'NONE';

  if (fromLeadership === 'NONE' && toLeadership !== 'NONE') {
    leadershipChange = 'gained';
  } else if (fromLeadership === 'FUNCTIONAL' && toLeadership === 'DISCIPLINARY') {
    leadershipChange = 'upgraded';
  } else if (fromLeadership !== 'NONE' && toLeadership === 'NONE') {
    leadershipChange = 'lost';
  }

  const positiveDelta = skillComparisons.filter((s) => s.delta > 0);
  const averageLevelIncrease =
    positiveDelta.length > 0
      ? positiveDelta.reduce((sum, s) => sum + s.delta, 0) / positiveDelta.length
      : 0;

  return {
    fromRole: fromRole
      ? {
          id: fromRole.id,
          name: fromRole.title,
          level: fromRole.level,
          leadershipType: fromRole.leadershipType ?? 'NONE',
          team: fromRole.team,
        }
      : null,
    toRole: {
      id: toRole.id,
      name: toRole.title,
      level: toRole.level,
      leadershipType: toRole.leadershipType ?? 'NONE',
      hasBudgetAuth: toRole.hasBudgetResp,
      team: toRole.team,
      reportsTo: toRole.directReportTo,
    },
    skillComparisons,
    radarChartData,
    responsibilityDiff,
    softSkillComparisons,
    summary: {
      totalSkillUpgrades: skillUpgrades.length,
      totalNewSkills: newSkills.length,
      totalRemovedSkills: removedSkills.length,
      newResponsibilities: addedResponsibilities.length,
      removedResponsibilities: removedResponsibilities.length,
      leadershipChange,
      averageLevelIncrease: Math.round(averageLevelIncrease * 10) / 10,
    },
  };
}

export function calculateResponsibilityDiff(
  fromResponsibilities: { id: string; text: string; category: string | null }[],
  toResponsibilities: { id: string; text: string; category: string | null }[]
): ResponsibilityDiff[] {
  const results: ResponsibilityDiff[] = [];
  const matchedFromIds = new Set<string>();

  for (const toResp of toResponsibilities) {
    let bestMatch: { id: string; similarity: number } | null = null;

    for (const fromResp of fromResponsibilities) {
      if (matchedFromIds.has(fromResp.id)) continue;

      const similarity = calculateSimilarity(
        normalizeText(fromResp.text),
        normalizeText(toResp.text)
      );

      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { id: fromResp.id, similarity };
      }
    }

    if (bestMatch) {
      matchedFromIds.add(bestMatch.id);
      results.push({
        id: toResp.id,
        text: toResp.text,
        category: toResp.category,
        status: bestMatch.similarity > 0.95 ? 'unchanged' : 'modified',
        similarity: bestMatch.similarity,
      });
    } else {
      results.push({
        id: toResp.id,
        text: toResp.text,
        category: toResp.category,
        status: 'added',
      });
    }
  }

  for (const fromResp of fromResponsibilities) {
    if (!matchedFromIds.has(fromResp.id)) {
      results.push({
        id: fromResp.id,
        text: fromResp.text,
        category: fromResp.category,
        status: 'removed',
      });
    }
  }

  return results;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(b.split(' ').filter((w) => w.length > 2));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
}

/**
 * Transformiert geparste Rollen-Daten in Prisma Seed-Strukturen
 */

import type { ParsedRole, ParsedSkill } from "./parseRoleHTML";

export interface SeedData {
  occupationalFields: { title: string }[];
  competenceFields: { title: string }[];
  softSkills: { title: string }[];
  skills: {
    title: string;
    competenceField: string;
  }[];
  roles: {
    title: string;
    level: string;
    occupationalField: string;
    description?: string;
    team?: string;
    hasLeadership: boolean;
    leadershipType?: string;
    hasBudgetResp: boolean;
    directReportTo?: string;
    responsibilities: string[];
    skills: { title: string; minLevel: number }[];
    softSkills: string[];
  }[];
}

/**
 * Sammelt und dedupliziert alle Entitäten aus den geparsten Rollen
 */
export function transformToSeed(parsedRoles: ParsedRole[]): SeedData {
  const occupationalFieldsSet = new Set<string>();
  const competenceFieldsSet = new Set<string>();
  const softSkillsSet = new Set<string>();
  const skillsMap = new Map<string, string>(); // title -> competenceField

  // Sammle alle eindeutigen Werte
  for (const role of parsedRoles) {
    if (role.occupationalField) {
      occupationalFieldsSet.add(role.occupationalField);
    }

    for (const skill of role.skills) {
      competenceFieldsSet.add(skill.competenceField);
      skillsMap.set(skill.title, skill.competenceField);
    }

    for (const softSkill of role.softSkills) {
      softSkillsSet.add(softSkill);
    }
  }

  return {
    occupationalFields: Array.from(occupationalFieldsSet).map((title) => ({
      title,
    })),
    competenceFields: Array.from(competenceFieldsSet).map((title) => ({
      title,
    })),
    softSkills: Array.from(softSkillsSet).map((title) => ({ title })),
    skills: Array.from(skillsMap.entries()).map(([title, competenceField]) => ({
      title,
      competenceField,
    })),
    roles: parsedRoles.map((role) => ({
      title: role.title,
      level: role.level,
      occupationalField: role.occupationalField,
      description: role.description,
      team: role.team,
      hasLeadership: role.hasLeadership,
      leadershipType: role.leadershipType,
      hasBudgetResp: role.hasBudgetResp,
      directReportTo: role.directReportTo,
      responsibilities: role.responsibilities,
      skills: role.skills.map((s) => ({
        title: s.title,
        minLevel: s.minLevel,
      })),
      softSkills: role.softSkills,
    })),
  };
}

/**
 * Generiert TypeScript-Code für statisches Seeding
 */
export function generateSeedCode(data: SeedData): string {
  return `
// Auto-generated seed data
export const seedData = ${JSON.stringify(data, null, 2)} as const;
`;
}

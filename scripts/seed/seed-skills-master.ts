// scripts/seed/seed-skills-master.ts
// Seeder für Master-Skill-Dateien (soft-skills.json & hard-skills.json)
// Usage: npx tsx scripts/seed/seed-skills-master.ts

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface SoftSkillInput {
  id: string;
  name: string;
  category?: string;
}

interface HardSkillInput {
  id: string;
  name: string;
  traxId?: string;
}

interface CompetenceFieldInput {
  id: string;
  name: string;
  traxId?: string;
  skills: HardSkillInput[];
}

interface SoftSkillsFile {
  version: string;
  lastUpdated: string;
  softSkills: SoftSkillInput[];
}

interface HardSkillsFile {
  version: string;
  lastUpdated: string;
  changelog?: string[];
  competenceFields: CompetenceFieldInput[];
}

interface SeedStats {
  created: number;
  updated: number;
  unchanged: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadJsonFile<T>(relativePath: string): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content) as T;
}

function formatStats(stats: SeedStats): string {
  const parts: string[] = [];
  if (stats.created > 0) parts.push(`${stats.created} neu`);
  if (stats.updated > 0) parts.push(`${stats.updated} aktualisiert`);
  if (stats.unchanged > 0) parts.push(`${stats.unchanged} unverändert`);
  return parts.join(', ') || '0';
}

// ============================================================================
// SEEDERS
// ============================================================================

async function seedSoftSkills(): Promise<SeedStats> {
  const stats: SeedStats = { created: 0, updated: 0, unchanged: 0 };

  const data = loadJsonFile<SoftSkillsFile>('data/skills/soft-skills.json');
  console.log(`\nLoading: soft-skills.json (v${data.version})`);

  for (const ss of data.softSkills) {
    const existing = await prisma.softSkill.findUnique({
      where: { slug: ss.id },
    });

    if (existing) {
      // Check if update needed
      if (existing.title !== ss.name || existing.category !== (ss.category ?? null)) {
        await prisma.softSkill.update({
          where: { slug: ss.id },
          data: {
            title: ss.name,
            category: ss.category ?? null,
          },
        });
        stats.updated++;
      } else {
        stats.unchanged++;
      }
    } else {
      await prisma.softSkill.create({
        data: {
          id: ss.id,
          title: ss.name,
          slug: ss.id,
          category: ss.category ?? null,
        },
      });
      stats.created++;
    }
  }

  return stats;
}

async function seedHardSkills(): Promise<{ cfStats: SeedStats; skillStats: SeedStats }> {
  const cfStats: SeedStats = { created: 0, updated: 0, unchanged: 0 };
  const skillStats: SeedStats = { created: 0, updated: 0, unchanged: 0 };

  const data = loadJsonFile<HardSkillsFile>('data/skills/hard-skills.json');
  console.log(`\nLoading: hard-skills.json (v${data.version})`);

  for (const cf of data.competenceFields) {
    // Upsert Competence Field
    const existingCf = await prisma.competenceField.findUnique({
      where: { slug: cf.id },
    });

    let cfId: string;

    if (existingCf) {
      if (existingCf.title !== cf.name) {
        const updated = await prisma.competenceField.update({
          where: { slug: cf.id },
          data: { title: cf.name },
        });
        cfId = updated.id;
        cfStats.updated++;
      } else {
        cfId = existingCf.id;
        cfStats.unchanged++;
      }
    } else {
      const created = await prisma.competenceField.create({
        data: {
          id: cf.id,
          title: cf.name,
          slug: cf.id,
        },
      });
      cfId = created.id;
      cfStats.created++;
    }

    // Upsert Skills for this Competence Field
    for (const skill of cf.skills) {
      const existingSkill = await prisma.skill.findUnique({
        where: { slug: skill.id },
      });

      if (existingSkill) {
        if (existingSkill.title !== skill.name || existingSkill.competenceFieldId !== cfId) {
          await prisma.skill.update({
            where: { slug: skill.id },
            data: {
              title: skill.name,
              competenceFieldId: cfId,
            },
          });
          skillStats.updated++;
        } else {
          skillStats.unchanged++;
        }
      } else {
        await prisma.skill.create({
          data: {
            id: skill.id,
            title: skill.name,
            slug: skill.id,
            competenceFieldId: cfId,
          },
        });
        skillStats.created++;
      }
    }
  }

  return { cfStats, skillStats };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          CAREER UNIVERSE - Skill Master Seeder               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    // Seed Soft Skills
    const ssStats = await seedSoftSkills();
    const ssTotal = ssStats.created + ssStats.updated + ssStats.unchanged;
    console.log(`✓ ${ssTotal} Soft Skills importiert (${formatStats(ssStats)})`);

    // Seed Hard Skills
    const { cfStats, skillStats } = await seedHardSkills();
    const cfTotal = cfStats.created + cfStats.updated + cfStats.unchanged;
    const skillTotal = skillStats.created + skillStats.updated + skillStats.unchanged;
    console.log(`✓ ${cfTotal} Competence Fields importiert (${formatStats(cfStats)})`);
    console.log(`✓ ${skillTotal} Hard Skills importiert (${formatStats(skillStats)})`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ SKILL MASTER SEEDING COMPLETE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

// scripts/seed/seed-json-roles.ts
// Seed-Script für JSON-basierte Rollendaten
// Usage:
//   npx tsx scripts/seed/seed-json-roles.ts                     # Seed all JSON files
//   npx tsx scripts/seed/seed-json-roles.ts <file.json>         # Seed specific file
//   npx tsx scripts/seed/seed-json-roles.ts data/roles/         # Seed all in directory

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, RoleLevel } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

interface RoleSkillInput {
  name: string;
  level: number;
  competenceField: string;
}

interface RoleLevelInput {
  id: string;
  slug: string;
  title: string;
  level: string;
  levelOrder: number;
  traxId?: string;
  description: string;
  leadership: boolean;
  budgetResponsibility: boolean;
  team?: string;
  responsibilities: string[];
  softSkills: string[];
  skills: RoleSkillInput[];
}

interface RoleFamilyInput {
  roleFamily: string;
  category: string;
  team: string;
  directReportTo: string;
  languages: string[];
  levels: RoleLevelInput[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function mapLevel(level: string): RoleLevel {
  const levelMap: Record<string, RoleLevel> = {
    'junior': 'JUNIOR',
    'professional': 'PROFESSIONAL',
    'senior': 'SENIOR',
    'functional lead': 'FUNCTIONAL_LEAD',
    'functional-lead': 'FUNCTIONAL_LEAD',
    'head of': 'HEAD_OF',
    'head-of': 'HEAD_OF',
  };
  return levelMap[level.toLowerCase()] || 'PROFESSIONAL';
}

// ============================================================================
// SEEDER CLASS
// ============================================================================

class JsonRoleSeeder {
  private competenceFieldCache = new Map<string, string>();
  private skillCache = new Map<string, string>();
  private softSkillCache = new Map<string, string>();

  async seedRoleFamily(data: RoleFamilyInput): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Seeding Role Family: ${data.roleFamily}`);
    console.log(`Category: ${data.category}`);
    console.log(`${'='.repeat(60)}`);

    // 1. Occupational Field (Category) erstellen/aktualisieren
    const fieldSlug = generateSlug(data.category);
    const occupationalField = await prisma.occupationalField.upsert({
      where: { slug: fieldSlug },
      create: {
        title: data.category,
        slug: fieldSlug,
      },
      update: {
        title: data.category,
      },
    });
    console.log(`\n✓ Occupational Field: ${occupationalField.title}`);

    // 2. Alle CompetenceFields und Skills vorab erstellen
    await this.ensureCompetenceFieldsAndSkills(data.levels);

    // 3. Alle SoftSkills vorab erstellen
    await this.ensureSoftSkills(data.levels);

    // 4. Jedes Level als Role erstellen
    for (const level of data.levels) {
      await this.seedRole(level, occupationalField.id, data);
    }

    console.log(`\n✓ Role Family "${data.roleFamily}" completed!`);
  }

  private async ensureCompetenceFieldsAndSkills(levels: RoleLevelInput[]): Promise<void> {
    // Sammle alle einzigartigen CompetenceFields und Skills
    const competenceFields = new Set<string>();
    const skillsByField = new Map<string, Set<string>>();

    for (const level of levels) {
      for (const skill of level.skills) {
        competenceFields.add(skill.competenceField);
        if (!skillsByField.has(skill.competenceField)) {
          skillsByField.set(skill.competenceField, new Set());
        }
        skillsByField.get(skill.competenceField)!.add(skill.name);
      }
    }

    // CompetenceFields erstellen
    for (const cfTitle of competenceFields) {
      const cfSlug = generateSlug(cfTitle);
      const cf = await prisma.competenceField.upsert({
        where: { slug: cfSlug },
        create: {
          title: cfTitle,
          slug: cfSlug,
        },
        update: {},
      });
      this.competenceFieldCache.set(cfTitle, cf.id);
    }
    console.log(`✓ ${competenceFields.size} Competence Fields`);

    // Skills erstellen
    let skillCount = 0;
    for (const [cfTitle, skills] of skillsByField) {
      const cfId = this.competenceFieldCache.get(cfTitle)!;
      for (const skillName of skills) {
        const skillSlug = generateSlug(skillName);
        const skill = await prisma.skill.upsert({
          where: { slug: skillSlug },
          create: {
            title: skillName,
            slug: skillSlug,
            fieldId: cfId,
          },
          update: {},
        });
        this.skillCache.set(skillName, skill.id);
        skillCount++;
      }
    }
    console.log(`✓ ${skillCount} Skills`);
  }

  private async ensureSoftSkills(levels: RoleLevelInput[]): Promise<void> {
    const softSkills = new Set<string>();
    for (const level of levels) {
      for (const ss of level.softSkills) {
        softSkills.add(ss);
      }
    }

    for (const ssTitle of softSkills) {
      const ssSlug = generateSlug(ssTitle);
      const ss = await prisma.softSkill.upsert({
        where: { slug: ssSlug },
        create: {
          title: ssTitle,
          slug: ssSlug,
        },
        update: {},
      });
      this.softSkillCache.set(ssTitle, ss.id);
    }
    console.log(`✓ ${softSkills.size} Soft Skills`);
  }

  private async seedRole(
    level: RoleLevelInput,
    fieldId: string,
    family: RoleFamilyInput
  ): Promise<void> {
    const roleSlug = level.slug || generateSlug(`${level.title}-${level.level}`);
    const roleLevel = mapLevel(level.level);

    // Role erstellen/aktualisieren
    const role = await prisma.role.upsert({
      where: { slug: roleSlug },
      create: {
        id: level.traxId || undefined,
        title: level.title,
        slug: roleSlug,
        level: roleLevel,
        description: level.description,
        team: level.team || family.team,
        hasLeadership: level.leadership,
        leadershipType: level.leadership ? 'Functional' : null,
        hasBudgetResp: level.budgetResponsibility,
        directReportTo: family.directReportTo,
        language: family.languages[0] || 'english',
        fieldId,
      },
      update: {
        title: level.title,
        description: level.description,
        team: level.team || family.team,
        hasLeadership: level.leadership,
        leadershipType: level.leadership ? 'Functional' : null,
        hasBudgetResp: level.budgetResponsibility,
        directReportTo: family.directReportTo,
      },
    });

    console.log(`\n  📋 Role: ${role.title} (${roleLevel})`);

    // Alte RoleSkills löschen
    await prisma.roleSkill.deleteMany({
      where: { roleId: role.id },
    });

    // Neue RoleSkills erstellen
    for (const skillInput of level.skills) {
      const skillId = this.skillCache.get(skillInput.name);
      if (skillId) {
        await prisma.roleSkill.create({
          data: {
            roleId: role.id,
            skillId,
            minLevel: skillInput.level,
          },
        });
      }
    }
    console.log(`     ✓ ${level.skills.length} Skills verknüpft`);

    // Alte Responsibilities löschen
    await prisma.responsibility.deleteMany({
      where: { roleId: role.id },
    });

    // Neue Responsibilities erstellen
    await prisma.responsibility.createMany({
      data: level.responsibilities.map((text, index) => ({
        text,
        order: index,
        roleId: role.id,
      })),
    });
    console.log(`     ✓ ${level.responsibilities.length} Responsibilities`);

    // SoftSkills verknüpfen
    const softSkillIds = level.softSkills
      .map(ss => this.softSkillCache.get(ss))
      .filter((id): id is string => id !== undefined);

    await prisma.role.update({
      where: { id: role.id },
      data: {
        softSkills: {
          set: softSkillIds.map(id => ({ id })),
        },
      },
    });
    console.log(`     ✓ ${softSkillIds.length} Soft Skills verknüpft`);
  }
}

// ============================================================================
// FILE LOADING
// ============================================================================

function loadJsonFile(filePath: string): RoleFamilyInput {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content) as RoleFamilyInput;
}

function getJsonFilesInDirectory(dirPath: string): string[] {
  const absolutePath = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(process.cwd(), dirPath);

  const files: string[] = [];
  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('.')) {
      files.push(path.join(absolutePath, entry.name));
    }
  }

  return files;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          CAREER UNIVERSE - JSON Role Seeder                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const seeder = new JsonRoleSeeder();
  const args = process.argv.slice(2);

  try {
    let filesToProcess: string[] = [];

    if (args.length === 0) {
      // Default: Alle JSON-Dateien im data/roles Verzeichnis
      const defaultDir = path.join(process.cwd(), 'data/roles');
      if (fs.existsSync(defaultDir)) {
        filesToProcess = getJsonFilesInDirectory(defaultDir);
      }

      if (filesToProcess.length === 0) {
        console.log('Usage:');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts                     # Seed all JSON files in data/roles/');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts <file.json>         # Seed specific file');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts data/roles/         # Seed all in directory');
        process.exit(0);
      }
    } else {
      const target = args[0];
      const targetPath = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

      if (fs.statSync(targetPath).isDirectory()) {
        filesToProcess = getJsonFilesInDirectory(targetPath);
      } else {
        filesToProcess = [targetPath];
      }
    }

    console.log(`Found ${filesToProcess.length} JSON file(s) to process.\n`);

    let totalRoles = 0;
    let totalFamilies = 0;

    for (const filePath of filesToProcess) {
      console.log(`\nLoading: ${path.basename(filePath)}`);
      const data = loadJsonFile(filePath);
      await seeder.seedRoleFamily(data);
      totalFamilies++;
      totalRoles += data.levels.length;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\nSeeded: ${totalFamilies} Role Familie(s), ${totalRoles} Role(s)`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

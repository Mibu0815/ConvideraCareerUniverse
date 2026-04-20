// scripts/seed/seed-json-roles.ts
// Seed-Script für JSON-basierte Rollendaten
// Usage:
//   npx tsx scripts/seed/seed-json-roles.ts                     # Seed all JSON files
//   npx tsx scripts/seed/seed-json-roles.ts <file.json>         # Seed specific file
//   npx tsx scripts/seed/seed-json-roles.ts data/roles/         # Seed all in directory
//   npx tsx scripts/seed/seed-json-roles.ts --legacy            # Force legacy format (inline skill creation)

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, RoleLevel } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

// Legacy format: { name, level, competenceField }
interface LegacyRoleSkillInput {
  name: string;
  level: number;
  competenceField: string;
}

// New format: { skillId, level }
interface NewRoleSkillInput {
  skillId: string;
  level: number;
}

// Union type for skill input
type RoleSkillInput = LegacyRoleSkillInput | NewRoleSkillInput;

interface RoleLevelInput {
  id: string;
  slug: string;
  title: string;
  level: string;
  levelOrder: number;
  traxId?: string;
  description: string;
  leadership: boolean | string;
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
    'team lead': 'TEAM_LEAD',
    'team-lead': 'TEAM_LEAD',
    'functional lead': 'FUNCTIONAL_LEAD',
    'functional-lead': 'FUNCTIONAL_LEAD',
    'head of': 'HEAD_OF',
    'head-of': 'HEAD_OF',
  };
  return levelMap[level.toLowerCase()] || 'PROFESSIONAL';
}

function isLegacySkill(skill: RoleSkillInput): skill is LegacyRoleSkillInput {
  return 'name' in skill && 'competenceField' in skill;
}

function isNewSkill(skill: RoleSkillInput): skill is NewRoleSkillInput {
  return 'skillId' in skill;
}

// ============================================================================
// SEEDER CLASS
// ============================================================================

class JsonRoleSeeder {
  private competenceFieldCache = new Map<string, string>();
  private skillCache = new Map<string, string>(); // Maps skill name or skillId to DB id
  private softSkillCache = new Map<string, string>(); // Maps soft skill name or id to DB id
  private forceLegacy: boolean;
  private warnings: string[] = [];

  constructor(forceLegacy = false) {
    this.forceLegacy = forceLegacy;
  }

  getWarnings(): string[] {
    return this.warnings;
  }

  async seedRoleFamily(data: RoleFamilyInput): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Seeding Role Family: ${data.roleFamily}`);
    console.log(`Category: ${data.category}`);
    console.log(`${'='.repeat(60)}`);

    // Detect format
    const hasLegacySkills = data.levels.some(l => l.skills.some(isLegacySkill));
    const hasNewSkills = data.levels.some(l => l.skills.some(isNewSkill));
    const useLegacyMode = this.forceLegacy || (hasLegacySkills && !hasNewSkills);

    if (useLegacyMode) {
      console.log(`\n⚠️  Using LEGACY mode (inline skill creation)`);
    } else {
      console.log(`\n✓ Using MASTER REFERENCE mode`);
    }

    // 1. Occupational Field (Category) erstellen/aktualisieren
    const fieldSlug = generateSlug(data.category);
    const occupationalField = await prisma.occupationalField.upsert({
      where: { slug: fieldSlug },
      create: {
        id: fieldSlug,
        title: data.category,
        slug: fieldSlug,
      },
      update: {
        title: data.category,
      },
    });
    console.log(`✓ Occupational Field: ${occupationalField.title}`);

    if (useLegacyMode) {
      // Legacy mode: Create CompetenceFields and Skills inline
      await this.ensureCompetenceFieldsAndSkillsLegacy(data.levels);
      await this.ensureSoftSkillsLegacy(data.levels);
    } else {
      // New mode: Load from master tables
      await this.loadMasterSkills();
      await this.loadMasterSoftSkills();
    }

    // Seed each role level
    for (const level of data.levels) {
      await this.seedRole(level, occupationalField.id, data, useLegacyMode);
    }

    console.log(`\n✓ Role Family "${data.roleFamily}" completed!`);
  }

  private async loadMasterSkills(): Promise<void> {
    const skills = await prisma.skill.findMany({
      select: { id: true, slug: true, title: true },
    });
    for (const skill of skills) {
      this.skillCache.set(skill.slug, skill.id);
      this.skillCache.set(skill.title, skill.id); // Also cache by title for flexibility
    }
    console.log(`✓ Loaded ${skills.length} Skills from master`);
  }

  private async loadMasterSoftSkills(): Promise<void> {
    const softSkills = await prisma.softSkill.findMany({
      select: { id: true, slug: true, title: true },
    });
    for (const ss of softSkills) {
      this.softSkillCache.set(ss.slug, ss.id);
      this.softSkillCache.set(ss.title, ss.id); // Also cache by title
    }
    console.log(`✓ Loaded ${softSkills.length} Soft Skills from master`);
  }

  private async ensureCompetenceFieldsAndSkillsLegacy(levels: RoleLevelInput[]): Promise<void> {
    const competenceFields = new Set<string>();
    const skillsByField = new Map<string, Set<string>>();

    for (const level of levels) {
      for (const skill of level.skills) {
        if (isLegacySkill(skill)) {
          competenceFields.add(skill.competenceField);
          if (!skillsByField.has(skill.competenceField)) {
            skillsByField.set(skill.competenceField, new Set());
          }
          skillsByField.get(skill.competenceField)!.add(skill.name);
        }
      }
    }

    let cfCreated = 0;
    let cfExisting = 0;
    for (const cfTitle of competenceFields) {
      const cfSlug = generateSlug(cfTitle);
      // First try to find by slug
      let cf = await prisma.competenceField.findUnique({
        where: { slug: cfSlug },
      });
      // Also try by title
      if (!cf) {
        cf = await prisma.competenceField.findUnique({
          where: { title: cfTitle },
        });
      }
      if (cf) {
        cfExisting++;
      } else {
        cf = await prisma.competenceField.create({
          data: { id: cfSlug, title: cfTitle, slug: cfSlug },
        });
        cfCreated++;
      }
      this.competenceFieldCache.set(cfTitle, cf.id);
    }
    console.log(`✓ ${cfCreated} Competence Fields erstellt, ${cfExisting} aus Master verwendet`);

    let skillCount = 0;
    let existingCount = 0;
    for (const [cfTitle, skills] of skillsByField) {
      const cfId = this.competenceFieldCache.get(cfTitle)!;
      for (const skillName of skills) {
        const skillSlug = generateSlug(skillName);
        // First check if skill already exists by slug (e.g., from master seeder)
        let skill = await prisma.skill.findUnique({
          where: { slug: skillSlug },
        });
        // Also try to find by title+fieldId combination
        if (!skill) {
          skill = await prisma.skill.findFirst({
            where: { title: skillName, fieldId: cfId },
          });
        }
        // Also try to find by title alone (may be in different competence field)
        if (!skill) {
          skill = await prisma.skill.findFirst({
            where: { title: skillName },
          });
        }
        if (skill) {
          existingCount++;
        } else {
          skill = await prisma.skill.create({
            data: { id: skillSlug, title: skillName, slug: skillSlug, fieldId: cfId },
          });
          skillCount++;
        }
        this.skillCache.set(skillName, skill.id);
      }
    }
    console.log(`✓ ${skillCount} Skills erstellt, ${existingCount} aus Master verwendet`);
  }

  private async ensureSoftSkillsLegacy(levels: RoleLevelInput[]): Promise<void> {
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
        create: { id: ssSlug, title: ssTitle, slug: ssSlug },
        update: {},
      });
      this.softSkillCache.set(ssTitle, ss.id);
    }
    console.log(`✓ ${softSkills.size} Soft Skills`);
  }

  private async seedRole(
    level: RoleLevelInput,
    fieldId: string,
    family: RoleFamilyInput,
    useLegacyMode: boolean
  ): Promise<void> {
    const roleSlug = level.slug || generateSlug(`${level.title}-${level.level}`);
    const roleLevel = mapLevel(level.level);

    const hasLeadership = level.leadership === true ||
      (typeof level.leadership === 'string' && level.leadership !== '');
    const leadershipType = typeof level.leadership === 'string'
      ? level.leadership.charAt(0).toUpperCase() + level.leadership.slice(1).toLowerCase()
      : (level.leadership ? 'Functional' : null);

    const role = await prisma.role.upsert({
      where: { slug: roleSlug },
      create: {
        id: level.id,
        title: level.title,
        slug: roleSlug,
        level: roleLevel,
        description: level.description,
        team: level.team || family.team,
        hasLeadership: hasLeadership,
        leadershipType: hasLeadership ? leadershipType : null,
        hasBudgetResp: level.budgetResponsibility,
        directReportTo: family.directReportTo,
        language: family.languages[0] || 'english',
        fieldId,
        updatedAt: new Date(),
      },
      update: {
        title: level.title,
        level: roleLevel,
        description: level.description,
        team: level.team || family.team,
        hasLeadership: hasLeadership,
        leadershipType: hasLeadership ? leadershipType : null,
        hasBudgetResp: level.budgetResponsibility,
        directReportTo: family.directReportTo,
        updatedAt: new Date(),
      },
    });

    console.log(`\n  📋 Role: ${role.title} (${roleLevel})`);

    // Delete existing RoleSkillRequirements
    await prisma.roleSkill.deleteMany({ where: { roleId: role.id } });

    // Create new RoleSkills
    let linkedSkills = 0;
    let missingSkills: string[] = [];

    for (const skillInput of level.skills) {
      let skillId: string | undefined;
      let skillKey: string;

      if (isNewSkill(skillInput)) {
        skillKey = skillInput.skillId;
        skillId = this.skillCache.get(skillInput.skillId);
      } else if (isLegacySkill(skillInput)) {
        skillKey = skillInput.name;
        skillId = this.skillCache.get(skillInput.name);
      } else {
        continue;
      }

      if (skillId) {
        await prisma.roleSkill.create({
          data: {
            roleId: role.id,
            skillId,
            minLevel: skillInput.level,
          },
        });
        linkedSkills++;
      } else {
        missingSkills.push(skillKey);
        if (!useLegacyMode) {
          this.warnings.push(`Role "${level.title}": Unknown skill "${skillKey}"`);
        }
      }
    }

    const refMode = useLegacyMode ? '' : ' (via Master-Referenz)';
    console.log(`     ✓ ${linkedSkills} Skills verknüpft${refMode}`);
    if (missingSkills.length > 0 && !useLegacyMode) {
      console.log(`     ⚠️  ${missingSkills.length} Skills nicht gefunden: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? '...' : ''}`);
    }

    // Delete existing Responsibilities
    await prisma.responsibility.deleteMany({ where: { roleId: role.id } });

    // Create Responsibilities
    await prisma.responsibility.createMany({
      data: level.responsibilities.map((text, index) => ({
        id: `${role.id}-resp-${index}`,
        text,
        order: index,
        roleId: role.id,
      })),
    });
    console.log(`     ✓ ${level.responsibilities.length} Responsibilities`);

    // Link SoftSkills
    let linkedSoftSkills = 0;
    let missingSoftSkills: string[] = [];
    const softSkillIds: string[] = [];

    for (const ssInput of level.softSkills) {
      // Try to find by ID (slug) first, then by title
      const ssId = this.softSkillCache.get(ssInput);
      if (ssId) {
        softSkillIds.push(ssId);
        linkedSoftSkills++;
      } else {
        missingSoftSkills.push(ssInput);
        if (!useLegacyMode) {
          this.warnings.push(`Role "${level.title}": Unknown soft skill "${ssInput}"`);
        }
      }
    }

    // Update role's soft skill connections (implicit many-to-many)
    await prisma.role.update({
      where: { id: role.id },
      data: {
        SoftSkill: {
          set: softSkillIds.map(id => ({ id })),
        },
      },
    });

    console.log(`     ✓ ${linkedSoftSkills} Soft Skills verknüpft${refMode}`);
    if (missingSoftSkills.length > 0 && !useLegacyMode) {
      console.log(`     ⚠️  ${missingSoftSkills.length} Soft Skills nicht gefunden: ${missingSoftSkills.slice(0, 3).join(', ')}${missingSoftSkills.length > 3 ? '...' : ''}`);
    }
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

  const args = process.argv.slice(2);
  const forceLegacy = args.includes('--legacy');
  const filteredArgs = args.filter(a => a !== '--legacy');

  const seeder = new JsonRoleSeeder(forceLegacy);

  try {
    let filesToProcess: string[] = [];

    if (filteredArgs.length === 0) {
      const defaultDir = path.join(process.cwd(), 'data/roles');
      if (fs.existsSync(defaultDir)) {
        filesToProcess = getJsonFilesInDirectory(defaultDir);
      }

      if (filesToProcess.length === 0) {
        console.log('Usage:');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts                     # Seed all JSON files');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts <file.json>         # Seed specific file');
        console.log('  npx tsx scripts/seed/seed-json-roles.ts --legacy            # Force legacy mode');
        process.exit(0);
      }
    } else {
      const target = filteredArgs[0];
      const targetPath = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

      if (fs.statSync(targetPath).isDirectory()) {
        filesToProcess = getJsonFilesInDirectory(targetPath);
      } else {
        filesToProcess = [targetPath];
      }
    }

    console.log(`Found ${filesToProcess.length} JSON file(s) to process.`);
    if (forceLegacy) {
      console.log(`\n⚠️  LEGACY MODE ENABLED - Skills will be created inline`);
    }

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

    // Show warnings summary
    const warnings = seeder.getWarnings();
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} Warning(s):`);
      warnings.slice(0, 10).forEach(w => console.log(`   - ${w}`));
      if (warnings.length > 10) {
        console.log(`   ... and ${warnings.length - 10} more`);
      }
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

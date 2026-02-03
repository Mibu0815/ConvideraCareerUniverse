// scripts/seed/validate-role-json.ts
// Validiert Rollen-JSONs gegen die Master-Skill-Dateien
// Usage:
//   npx tsx scripts/seed/validate-role-json.ts                     # Validate all JSON files
//   npx tsx scripts/seed/validate-role-json.ts <file.json>         # Validate specific file
//   npx tsx scripts/seed/validate-role-json.ts data/roles/         # Validate all in directory

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface SoftSkillMaster {
  id: string;
  name: string;
  category?: string;
}

interface HardSkillMaster {
  id: string;
  name: string;
  traxId?: string;
}

interface CompetenceFieldMaster {
  id: string;
  name: string;
  traxId?: string;
  skills: HardSkillMaster[];
}

interface SoftSkillsFile {
  version: string;
  lastUpdated: string;
  softSkills: SoftSkillMaster[];
}

interface HardSkillsFile {
  version: string;
  lastUpdated: string;
  changelog?: string[];
  competenceFields: CompetenceFieldMaster[];
}

// Legacy format
interface LegacyRoleSkillInput {
  name: string;
  level: number;
  competenceField: string;
}

// New format
interface NewRoleSkillInput {
  skillId: string;
  level: number;
}

type RoleSkillInput = LegacyRoleSkillInput | NewRoleSkillInput;

interface RoleLevelInput {
  id: string;
  slug: string;
  title: string;
  level: string;
  softSkills: string[];
  skills: RoleSkillInput[];
}

interface RoleFamilyInput {
  roleFamily: string;
  category: string;
  levels: RoleLevelInput[];
}

interface ValidationError {
  file: string;
  role: string;
  type: 'soft-skill' | 'hard-skill' | 'competence-field';
  message: string;
  suggestion?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function loadJsonFile<T>(relativePath: string): T | null {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content) as T;
}

function isLegacySkill(skill: RoleSkillInput): skill is LegacyRoleSkillInput {
  return 'name' in skill && 'competenceField' in skill;
}

function isNewSkill(skill: RoleSkillInput): skill is NewRoleSkillInput {
  return 'skillId' in skill;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findSimilar(input: string, candidates: string[], maxDistance = 3): string | null {
  const inputLower = input.toLowerCase();
  let bestMatch: string | null = null;
  let bestDistance = maxDistance + 1;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(inputLower, candidate.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class RoleJsonValidator {
  private softSkillIds = new Set<string>();
  private softSkillNames = new Set<string>();
  private hardSkillIds = new Set<string>();
  private hardSkillNames = new Set<string>();
  private competenceFieldIds = new Set<string>();
  private competenceFieldNames = new Set<string>();
  private errors: ValidationError[] = [];

  constructor() {
    this.loadMasterFiles();
  }

  private loadMasterFiles(): void {
    // Load soft skills
    const softSkillsData = loadJsonFile<SoftSkillsFile>('data/skills/soft-skills.json');
    if (softSkillsData) {
      for (const ss of softSkillsData.softSkills) {
        this.softSkillIds.add(ss.id);
        this.softSkillNames.add(ss.name);
      }
      console.log(`✓ Loaded ${softSkillsData.softSkills.length} Soft Skills from master`);
    } else {
      console.log(`⚠️  soft-skills.json not found - soft skill validation disabled`);
    }

    // Load hard skills
    const hardSkillsData = loadJsonFile<HardSkillsFile>('data/skills/hard-skills.json');
    if (hardSkillsData) {
      for (const cf of hardSkillsData.competenceFields) {
        this.competenceFieldIds.add(cf.id);
        this.competenceFieldNames.add(cf.name);
        for (const skill of cf.skills) {
          this.hardSkillIds.add(skill.id);
          this.hardSkillNames.add(skill.name);
        }
      }
      const totalSkills = hardSkillsData.competenceFields.reduce(
        (sum, cf) => sum + cf.skills.length, 0
      );
      console.log(`✓ Loaded ${hardSkillsData.competenceFields.length} Competence Fields with ${totalSkills} Hard Skills from master`);
    } else {
      console.log(`⚠️  hard-skills.json not found - hard skill validation disabled`);
    }
  }

  validateFile(filePath: string): ValidationError[] {
    const fileErrors: ValidationError[] = [];
    const fileName = path.basename(filePath);

    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      fileErrors.push({
        file: fileName,
        role: '-',
        type: 'hard-skill',
        message: `File not found: ${absolutePath}`,
      });
      return fileErrors;
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const data = JSON.parse(content) as RoleFamilyInput;

    console.log(`\nValidating: ${fileName} (${data.roleFamily})`);

    for (const level of data.levels) {
      const roleLabel = `${level.title} (${level.level})`;

      // Validate soft skills
      for (const ss of level.softSkills) {
        // Check if it's an ID or a name
        const isValidId = this.softSkillIds.has(ss);
        const isValidName = this.softSkillNames.has(ss);

        if (!isValidId && !isValidName && this.softSkillIds.size > 0) {
          const suggestion = findSimilar(ss, [...this.softSkillIds, ...this.softSkillNames]);
          fileErrors.push({
            file: fileName,
            role: roleLabel,
            type: 'soft-skill',
            message: `Unknown soft skill "${ss}"`,
            suggestion: suggestion ? `did you mean "${suggestion}"?` : undefined,
          });
        }
      }

      // Validate hard skills
      for (const skill of level.skills) {
        if (isNewSkill(skill)) {
          // New format: validate skillId
          if (!this.hardSkillIds.has(skill.skillId) && this.hardSkillIds.size > 0) {
            const suggestion = findSimilar(skill.skillId, [...this.hardSkillIds]);
            fileErrors.push({
              file: fileName,
              role: roleLabel,
              type: 'hard-skill',
              message: `Unknown skill ID "${skill.skillId}"`,
              suggestion: suggestion ? `did you mean "${suggestion}"?` : undefined,
            });
          }
        } else if (isLegacySkill(skill)) {
          // Legacy format: validate name and competenceField
          if (!this.hardSkillNames.has(skill.name) && this.hardSkillNames.size > 0) {
            const suggestion = findSimilar(skill.name, [...this.hardSkillNames]);
            fileErrors.push({
              file: fileName,
              role: roleLabel,
              type: 'hard-skill',
              message: `Unknown skill name "${skill.name}" (legacy format)`,
              suggestion: suggestion ? `did you mean "${suggestion}"?` : undefined,
            });
          }

          if (!this.competenceFieldNames.has(skill.competenceField) &&
              !this.competenceFieldIds.has(skill.competenceField) &&
              this.competenceFieldIds.size > 0) {
            const suggestion = findSimilar(
              skill.competenceField,
              [...this.competenceFieldNames, ...this.competenceFieldIds]
            );
            fileErrors.push({
              file: fileName,
              role: roleLabel,
              type: 'competence-field',
              message: `Unknown competence field "${skill.competenceField}"`,
              suggestion: suggestion ? `did you mean "${suggestion}"?` : undefined,
            });
          }
        }

        // Validate skill level
        if (skill.level < 1 || skill.level > 4) {
          const skillKey = isNewSkill(skill) ? skill.skillId : (skill as LegacyRoleSkillInput).name;
          fileErrors.push({
            file: fileName,
            role: roleLabel,
            type: 'hard-skill',
            message: `Invalid skill level ${skill.level} for "${skillKey}" (must be 1-4)`,
          });
        }
      }
    }

    this.errors.push(...fileErrors);
    return fileErrors;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  printSummary(): void {
    if (this.errors.length === 0) {
      console.log('\n✅ All files validated successfully!');
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`❌ VALIDATION FAILED - ${this.errors.length} error(s) found`);
    console.log(`${'='.repeat(60)}\n`);

    // Group errors by file
    const errorsByFile = new Map<string, ValidationError[]>();
    for (const error of this.errors) {
      const key = error.file;
      if (!errorsByFile.has(key)) {
        errorsByFile.set(key, []);
      }
      errorsByFile.get(key)!.push(error);
    }

    for (const [file, errors] of errorsByFile) {
      console.log(`📄 ${file}:`);
      for (const error of errors) {
        const icon = error.type === 'soft-skill' ? '💚' :
                     error.type === 'hard-skill' ? '💪' : '📁';
        let msg = `   ${icon} ${error.role}: ${error.message}`;
        if (error.suggestion) {
          msg += ` - ${error.suggestion}`;
        }
        console.log(msg);
      }
      console.log('');
    }
  }
}

// ============================================================================
// FILE LOADING
// ============================================================================

function getJsonFilesInDirectory(dirPath: string): string[] {
  const absolutePath = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(process.cwd(), dirPath);

  if (!fs.existsSync(absolutePath)) {
    return [];
  }

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
  console.log('║       CAREER UNIVERSE - Role JSON Validator                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const validator = new RoleJsonValidator();
  const args = process.argv.slice(2);

  let filesToValidate: string[] = [];

  if (args.length === 0) {
    // Default: Validate all JSON files in data/roles
    const defaultDir = path.join(process.cwd(), 'data/roles');
    filesToValidate = getJsonFilesInDirectory(defaultDir);

    if (filesToValidate.length === 0) {
      console.log('Usage:');
      console.log('  npx tsx scripts/seed/validate-role-json.ts                     # Validate all JSON files');
      console.log('  npx tsx scripts/seed/validate-role-json.ts <file.json>         # Validate specific file');
      console.log('  npx tsx scripts/seed/validate-role-json.ts data/roles/         # Validate all in directory');
      process.exit(0);
    }
  } else {
    const target = args[0];
    const targetPath = path.isAbsolute(target) ? target : path.join(process.cwd(), target);

    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      filesToValidate = getJsonFilesInDirectory(targetPath);
    } else {
      filesToValidate = [targetPath];
    }
  }

  console.log(`Found ${filesToValidate.length} JSON file(s) to validate.\n`);

  let totalErrors = 0;
  for (const filePath of filesToValidate) {
    const errors = validator.validateFile(filePath);
    if (errors.length === 0) {
      console.log(`  ✓ Valid`);
    } else {
      console.log(`  ❌ ${errors.length} error(s)`);
      totalErrors += errors.length;
    }
  }

  validator.printSummary();

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Validation failed:', error);
  process.exit(1);
});

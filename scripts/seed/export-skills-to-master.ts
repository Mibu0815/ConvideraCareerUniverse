// scripts/seed/export-skills-to-master.ts
// Exportiert vorhandene Skills aus der DB in Master-JSON-Dateien
// Usage: npx tsx scripts/seed/export-skills-to-master.ts

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SoftSkillExport {
  id: string;
  name: string;
  category?: string;
}

interface HardSkillExport {
  id: string;
  name: string;
}

interface CompetenceFieldExport {
  id: string;
  name: string;
  skills: HardSkillExport[];
}

async function exportSoftSkills(): Promise<void> {
  const softSkills = await prisma.softSkill.findMany({
    orderBy: { title: 'asc' },
  });

  const exportData = {
    version: '1.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    softSkills: softSkills.map((ss): SoftSkillExport => ({
      id: ss.slug,
      name: ss.title,
      ...(ss.category && { category: ss.category }),
    })),
  };

  const outputPath = path.join(process.cwd(), 'data/skills/soft-skills.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`✓ Exported ${softSkills.length} Soft Skills to ${outputPath}`);
}

async function exportHardSkills(): Promise<void> {
  const competenceFields = await prisma.competenceField.findMany({
    include: {
      skills: {
        orderBy: { title: 'asc' },
      },
    },
    orderBy: { title: 'asc' },
  });

  const exportData = {
    version: '1.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    competenceFields: competenceFields.map((cf): CompetenceFieldExport => ({
      id: cf.slug,
      name: cf.title,
      skills: cf.skills.map((skill): HardSkillExport => ({
        id: skill.slug,
        name: skill.title,
      })),
    })),
  };

  const outputPath = path.join(process.cwd(), 'data/skills/hard-skills.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  const totalSkills = competenceFields.reduce((sum, cf) => sum + cf.skills.length, 0);
  console.log(`✓ Exported ${competenceFields.length} Competence Fields with ${totalSkills} Hard Skills to ${outputPath}`);
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CAREER UNIVERSE - Export Skills to Master Files        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    await exportSoftSkills();
    await exportHardSkills();
    console.log('\n✅ Export complete!');
  } catch (error) {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

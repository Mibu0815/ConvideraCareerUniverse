import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Datenbank-Inhalt ===\n');
  
  // Occupational Fields
  const fields = await prisma.occupationalField.findMany();
  console.log(`Occupational Fields: ${fields.length}`);
  fields.forEach(f => console.log(`  - ${f.title}`));
  
  // Roles
  const roles = await prisma.role.findMany({
    include: {
      OccupationalField: true,
      _count: { select: { RoleSkill: true, SoftSkill: true, Responsibility: true }}
    },
    orderBy: { title: 'asc' }
  });
  console.log(`\nRoles: ${roles.length}`);

  let currentField = '';
  roles.sort((a, b) => a.OccupationalField.title.localeCompare(b.OccupationalField.title));
  roles.forEach(r => {
    if (r.OccupationalField.title !== currentField) {
      currentField = r.OccupationalField.title;
      console.log(`\n  📁 ${currentField}:`);
    }
    console.log(`    📋 ${r.title} (${r.level})`);
    console.log(`       Skills: ${r._count.RoleSkill}, Soft Skills: ${r._count.SoftSkill}, Responsibilities: ${r._count.Responsibility}`);
  });
  
  // Skills Summary
  const skills = await prisma.skill.count();
  const softSkills = await prisma.softSkill.count();
  const compFields = await prisma.competenceField.count();
  
  console.log(`\n=== Zusammenfassung ===`);
  console.log(`Competence Fields: ${compFields}`);
  console.log(`Hard Skills: ${skills}`);
  console.log(`Soft Skills: ${softSkills}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);

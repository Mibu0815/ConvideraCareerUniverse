/**
 * Database Seeder für Career Universe
 *
 * Usage:
 *   pnpm db:seed
 *
 * Oder mit HTML-Dateien:
 *   tsx scripts/seed/seed.ts --html ./data/roles/*.html
 */

import { PrismaClient, RoleLevel } from "@prisma/client";
import { parseRoleHTML, type ParsedRole } from "./parseRoleHTML";
import { transformToSeed, type SeedData } from "./transformToSeed";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Standard Soft Skills Pool (50 Attribute)
const SOFT_SKILLS = [
  "Analytical Thinking",
  "Problem Solving",
  "Critical Thinking",
  "Creative Thinking",
  "Strategic Thinking",
  "Systems Thinking",
  "Communication",
  "Active Listening",
  "Written Communication",
  "Presentation Skills",
  "Negotiation",
  "Persuasion",
  "Collaboration",
  "Teamwork",
  "Cross-functional Collaboration",
  "Stakeholder Management",
  "Conflict Resolution",
  "Networking",
  "Leadership",
  "Mentoring",
  "Coaching",
  "Delegation",
  "Decision Making",
  "Accountability",
  "Adaptability",
  "Flexibility",
  "Resilience",
  "Learning Agility",
  "Growth Mindset",
  "Openness to Feedback",
  "Time Management",
  "Prioritization",
  "Organization",
  "Attention to Detail",
  "Multitasking",
  "Deadline Management",
  "Emotional Intelligence",
  "Empathy",
  "Self-awareness",
  "Self-regulation",
  "Motivation",
  "Stress Management",
  "Initiative",
  "Proactiveness",
  "Ownership",
  "Entrepreneurial Thinking",
  "Customer Focus",
  "Quality Orientation",
  "Innovation",
  "Continuous Improvement",
];

async function seedSoftSkills() {
  console.log("Seeding soft skills...");

  for (const title of SOFT_SKILLS) {
    await prisma.softSkill.upsert({
      where: { title },
      update: {},
      create: {
        title,
        slug: slugify(title),
      },
    });
  }

  console.log(`✓ Seeded ${SOFT_SKILLS.length} soft skills`);
}

async function seedFromData(data: SeedData) {
  // 1. Occupational Fields
  console.log("Seeding occupational fields...");
  const fieldMap = new Map<string, string>();

  for (const field of data.occupationalFields) {
    const created = await prisma.occupationalField.upsert({
      where: { title: field.title },
      update: {},
      create: {
        title: field.title,
        slug: slugify(field.title),
      },
    });
    fieldMap.set(field.title, created.id);
  }

  // 2. Competence Fields
  console.log("Seeding competence fields...");
  const compFieldMap = new Map<string, string>();

  for (const field of data.competenceFields) {
    const created = await prisma.competenceField.upsert({
      where: { title: field.title },
      update: {},
      create: {
        title: field.title,
        slug: slugify(field.title),
      },
    });
    compFieldMap.set(field.title, created.id);
  }

  // 3. Skills
  console.log("Seeding skills...");
  const skillMap = new Map<string, string>();

  for (const skill of data.skills) {
    const fieldId = compFieldMap.get(skill.competenceField);
    if (!fieldId) {
      console.warn(`Competence field not found: ${skill.competenceField}`);
      continue;
    }

    const created = await prisma.skill.upsert({
      where: {
        title_fieldId: {
          title: skill.title,
          fieldId,
        },
      },
      update: {},
      create: {
        title: skill.title,
        slug: slugify(`${skill.title}-${skill.competenceField}`),
        fieldId,
      },
    });
    skillMap.set(skill.title, created.id);
  }

  // 4. Roles with relations
  console.log("Seeding roles...");

  for (const roleData of data.roles) {
    const fieldId = fieldMap.get(roleData.occupationalField);
    if (!fieldId) {
      console.warn(`Occupational field not found: ${roleData.occupationalField}`);
      continue;
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        title: roleData.title,
        slug: slugify(`${roleData.title}-${roleData.level}`),
        level: roleData.level as RoleLevel,
        description: roleData.description,
        team: roleData.team,
        hasLeadership: roleData.hasLeadership,
        leadershipType: roleData.leadershipType,
        hasBudgetResp: roleData.hasBudgetResp,
        directReportTo: roleData.directReportTo,
        fieldId,
        responsibilities: {
          create: roleData.responsibilities.map((text) => ({ text })),
        },
        softSkills: {
          connect: roleData.softSkills
            .map((title) => ({ title }))
            .filter(Boolean),
        },
      },
    });

    // Connect skills with levels
    for (const skillData of roleData.skills) {
      const skillId = skillMap.get(skillData.title);
      if (!skillId) {
        console.warn(`Skill not found: ${skillData.title}`);
        continue;
      }

      await prisma.roleSkill.create({
        data: {
          roleId: role.id,
          skillId,
          minLevel: skillData.minLevel,
        },
      });
    }
  }

  console.log(`✓ Seeded ${data.roles.length} roles`);
}

async function seedFromHTML(htmlPaths: string[]) {
  const parsedRoles: ParsedRole[] = [];

  for (const htmlPath of htmlPaths) {
    const absolutePath = path.resolve(htmlPath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`File not found: ${absolutePath}`);
      continue;
    }

    const html = fs.readFileSync(absolutePath, "utf-8");
    const parsed = parseRoleHTML(html);
    parsedRoles.push(parsed);
    console.log(`Parsed: ${parsed.title} (${parsed.level})`);
  }

  if (parsedRoles.length === 0) {
    console.log("No roles parsed from HTML files.");
    return;
  }

  const seedData = transformToSeed(parsedRoles);
  await seedFromData(seedData);
}

async function main() {
  const args = process.argv.slice(2);

  try {
    // Always seed soft skills first
    await seedSoftSkills();

    // Check for HTML files argument
    const htmlIndex = args.indexOf("--html");
    if (htmlIndex !== -1 && args[htmlIndex + 1]) {
      const htmlPaths = args.slice(htmlIndex + 1);
      await seedFromHTML(htmlPaths);
    } else {
      console.log("No HTML files provided. Soft skills seeded.");
      console.log("Usage: pnpm db:seed --html ./path/to/role.html");
    }

    console.log("\n✓ Seeding complete!");
  } catch (error) {
    console.error("Seeding failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

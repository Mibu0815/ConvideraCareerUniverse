/**
 * HTML Parser für Trax Rollen-Profile
 *
 * Usage:
 *   pnpm db:parse "./data/roles/*.html"
 *   pnpm db:parse ./data/roles/backend-senior.html
 *
 * Das Skript verwendet Upserts für idempotente Ausführung.
 */

import { PrismaClient, RoleLevel } from "@prisma/client";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const prisma = new PrismaClient();

// ============================================================================
// Slug Utility
// ============================================================================

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

// ============================================================================
// Types
// ============================================================================

interface ParsedSkill {
  title: string;
  level: number;
  competenceField: string;
}

interface ParsedRole {
  title: string;
  level: RoleLevel;
  occupationalField: string;
  hasLeadership: boolean;
  leadershipType: string | null;
  hasBudgetResp: boolean;
  directReportTo: string | null;
  responsibilities: string[];
  skills: ParsedSkill[];
  softSkills: string[];
}

// ============================================================================
// Level Detection & Field Mapping
// ============================================================================

function detectRoleLevelFromText(levelText: string): {
  level: RoleLevel;
  hasLeadership: boolean;
  leadershipType: string | null;
  hasBudgetResp: boolean;
} {
  const text = levelText.toLowerCase().trim();

  if (text.includes("functional lead")) {
    return {
      level: RoleLevel.FUNCTIONAL_LEAD,
      hasLeadership: true,
      leadershipType: "Functional",
      hasBudgetResp: false,
    };
  }

  if (text.includes("head of") || text === "head") {
    return {
      level: RoleLevel.HEAD_OF,
      hasLeadership: true,
      leadershipType: "Disciplinary",
      hasBudgetResp: true,
    };
  }

  if (text.includes("senior")) {
    return {
      level: RoleLevel.SENIOR,
      hasLeadership: false,
      leadershipType: null,
      hasBudgetResp: false,
    };
  }

  if (text.includes("junior")) {
    return {
      level: RoleLevel.JUNIOR,
      hasLeadership: false,
      leadershipType: null,
      hasBudgetResp: false,
    };
  }

  // Default: Professional
  return {
    level: RoleLevel.PROFESSIONAL,
    hasLeadership: false,
    leadershipType: null,
    hasBudgetResp: false,
  };
}

function detectOccupationalField(title: string): string {
  const lowerTitle = title.toLowerCase();

  const fieldMappings: Record<string, string[]> = {
    "Software Engineering": [
      "backend",
      "frontend",
      "fullstack",
      "software",
      "developer",
      "engineer",
      "development",
      "mobile",
      "ios",
      "android",
    ],
    "Digital Marketing": [
      "marketing",
      "seo",
      "sem",
      "content",
      "social media",
      "campaign",
    ],
    "Data & Analytics": [
      "data",
      "analytics",
      "analyst",
      "business intelligence",
      "bi",
      "scientist",
    ],
    "Design": [
      "design",
      "ux",
      "ui",
      "product design",
      "visual",
      "graphic",
    ],
    "Project Management": [
      "project",
      "scrum",
      "agile",
      "product owner",
      "product manager",
    ],
    "DevOps & Cloud": [
      "devops",
      "cloud",
      "infrastructure",
      "sre",
      "platform",
      "ops",
    ],
    "Quality Assurance": [
      "qa",
      "quality",
      "test",
      "automation",
    ],
  };

  for (const [field, keywords] of Object.entries(fieldMappings)) {
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      return field;
    }
  }

  return "General";
}

// ============================================================================
// HTML Parser
// ============================================================================

function extractOccupationalFieldFromHTML($: cheerio.CheerioAPI): string | null {
  // Suche nach "Category" Header und extrahiere den Link-Text
  let category: string | null = null;

  // Methode 1: Suche nach h3 mit "Category" und folgendem Link
  $("h3").each((_, el) => {
    const headerText = $(el).text().toLowerCase().trim();
    if (headerText.includes("category") || headerText.includes("kategorie")) {
      // Suche im nächsten Element oder Parent-Container nach einem Link
      const nextLink = $(el).next().find("a, .trax-link").first();
      if (nextLink.length) {
        category = nextLink.text().trim();
        return false; // break
      }
      // Suche im Parent nach einem Link
      const parentLink = $(el).parent().find("a, .trax-link").first();
      if (parentLink.length && parentLink.text().trim() !== category) {
        category = parentLink.text().trim();
        return false;
      }
    }
  });

  // Methode 2: Suche nach .trax-role-page-category oder ähnlichem
  if (!category) {
    const categoryEl = $(".trax-role-page-category a, .trax-role-page-category .trax-link").first();
    if (categoryEl.length) {
      category = categoryEl.text().trim();
    }
  }

  return category;
}

function parseHTML(html: string, filename: string): ParsedRole {
  const $ = cheerio.load(html);

  // --- Role Title ---
  const title = $(".trax-page__title").first().text().trim() || filename;

  // --- Level Detection from .trax-role-page-level__level-name ---
  const levelText = $(".trax-role-page-level__level-name").first().text().trim();
  const { level, hasLeadership, leadershipType, hasBudgetResp } =
    detectRoleLevelFromText(levelText || title);

  // --- Occupational Field: First try HTML extraction, then fallback to title detection ---
  const htmlCategory = extractOccupationalFieldFromHTML($);
  const occupationalField = htmlCategory || detectOccupationalField(title);

  // --- Direct Report To ---
  // Suche nach "Direct report to" Text und extrahiere den Link-Text
  let directReportTo: string | null = null;

  // Methode 1: Suche nach Label + Link
  $("*").each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (text.includes("direct report to") || text.includes("reports to")) {
      const link = $(el).find("a").first();
      if (link.length) {
        directReportTo = link.text().trim();
      } else {
        // Suche im nächsten Geschwister-Element
        const nextLink = $(el).next().find("a").first();
        if (nextLink.length) {
          directReportTo = nextLink.text().trim();
        }
      }
    }
  });

  // Methode 2: Fallback - suche nach .trax-link nach "report" Text
  if (!directReportTo) {
    $(".trax-link, a").each((_, el) => {
      const parentText = $(el).parent().text().toLowerCase();
      if (parentText.includes("report")) {
        directReportTo = $(el).text().trim();
      }
    });
  }

  // --- Responsibilities ---
  const responsibilities: string[] = [];
  $(".trax-role-page-responsibilities li").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      responsibilities.push(text);
    }
  });

  // --- Hard Skills ---
  const skills: ParsedSkill[] = [];
  $(".trax-role-page-skill").each((_, el) => {
    const skillEl = $(el);

    // Skill Title
    const skillTitle = skillEl.find(".trax-role-page-skill__text").text().trim();
    if (!skillTitle) return;

    // Level aus CSS-Klasse: trax-role-page-skill__level_X
    let skillLevel = 1;
    const classList = skillEl.attr("class") || "";
    const levelMatch = classList.match(/trax-role-page-skill__level_(\d)/);
    if (levelMatch) {
      skillLevel = parseInt(levelMatch[1], 10);
    }

    // Competence Field aus Footer
    let competenceField = skillEl
      .find(".trax-role-page-skill__footer")
      .text()
      .trim();
    if (!competenceField) {
      competenceField = "General";
    }

    skills.push({
      title: skillTitle,
      level: Math.min(Math.max(skillLevel, 1), 4), // Clamp 1-4
      competenceField,
    });
  });

  // --- Soft Skills ---
  const softSkills: string[] = [];
  $(".trax-role-page-soft-skills__text").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      softSkills.push(text);
    }
  });

  return {
    title,
    level,
    occupationalField,
    hasLeadership,
    leadershipType,
    hasBudgetResp,
    directReportTo,
    responsibilities,
    skills,
    softSkills,
  };
}

// ============================================================================
// Database Seeding (Upserts)
// ============================================================================

async function seedRole(parsed: ParsedRole): Promise<void> {
  console.log(`\n📥 Processing: ${parsed.title}`);
  console.log(`   Level: ${parsed.level}${parsed.hasLeadership ? ` (${parsed.leadershipType} Leadership)` : ""}`);

  // 1. Upsert Occupational Field
  const fieldSlug = slugify(parsed.occupationalField);
  const occupationalField = await prisma.occupationalField.upsert({
    where: { title: parsed.occupationalField },
    update: {},
    create: {
      title: parsed.occupationalField,
      slug: fieldSlug,
    },
  });

  // 2. Upsert Competence Fields & Skills
  const skillIds = new Map<string, string>();

  for (const skill of parsed.skills) {
    const cfSlug = slugify(skill.competenceField);
    const competenceField = await prisma.competenceField.upsert({
      where: { title: skill.competenceField },
      update: {},
      create: {
        title: skill.competenceField,
        slug: cfSlug,
      },
    });

    const skillSlug = slugify(`${skill.title}-${skill.competenceField}`);
    const dbSkill = await prisma.skill.upsert({
      where: {
        title_fieldId: {
          title: skill.title,
          fieldId: competenceField.id,
        },
      },
      update: {},
      create: {
        title: skill.title,
        slug: skillSlug,
        fieldId: competenceField.id,
      },
    });

    skillIds.set(skill.title, dbSkill.id);
  }

  // 3. Upsert Soft Skills
  const softSkillIds: { id: string }[] = [];
  for (const title of parsed.softSkills) {
    const ssSlug = slugify(title);
    const softSkill = await prisma.softSkill.upsert({
      where: { title },
      update: {},
      create: {
        title,
        slug: ssSlug,
      },
    });
    softSkillIds.push({ id: softSkill.id });
  }

  // 4. Upsert Role (by title + level + fieldId)
  const existingRole = await prisma.role.findFirst({
    where: {
      title: parsed.title,
      level: parsed.level,
      fieldId: occupationalField.id,
    },
  });

  let roleId: string;

  if (existingRole) {
    // Update
    await prisma.role.update({
      where: { id: existingRole.id },
      data: {
        hasLeadership: parsed.hasLeadership,
        leadershipType: parsed.leadershipType,
        hasBudgetResp: parsed.hasBudgetResp,
        directReportTo: parsed.directReportTo,
        softSkills: { set: softSkillIds },
      },
    });
    roleId = existingRole.id;

    // Clean old relations for fresh update
    await prisma.responsibility.deleteMany({ where: { roleId } });
    await prisma.roleSkill.deleteMany({ where: { roleId } });

    console.log(`   ✓ Updated existing role`);
  } else {
    // Create
    const roleSlug = slugify(`${parsed.title}-${parsed.level}`);
    const newRole = await prisma.role.create({
      data: {
        title: parsed.title,
        slug: roleSlug,
        level: parsed.level,
        fieldId: occupationalField.id,
        hasLeadership: parsed.hasLeadership,
        leadershipType: parsed.leadershipType,
        hasBudgetResp: parsed.hasBudgetResp,
        directReportTo: parsed.directReportTo,
        softSkills: { connect: softSkillIds },
      },
    });
    roleId = newRole.id;
    console.log(`   ✓ Created new role`);
  }

  // 5. Create Responsibilities
  if (parsed.responsibilities.length > 0) {
    await prisma.responsibility.createMany({
      data: parsed.responsibilities.map((text) => ({ text, roleId })),
    });
  }

  // 6. Create RoleSkills with levels
  for (const skill of parsed.skills) {
    const skillId = skillIds.get(skill.title);
    if (!skillId) continue;

    await prisma.roleSkill.create({
      data: { roleId, skillId, minLevel: skill.level },
    });
  }

  console.log(`   ✓ ${parsed.responsibilities.length} responsibilities`);
  console.log(`   ✓ ${parsed.skills.length} skills`);
  console.log(`   ✓ ${parsed.softSkills.length} soft skills`);
  if (parsed.directReportTo) {
    console.log(`   ✓ Reports to: ${parsed.directReportTo}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  pnpm db:parse <html-files-or-glob>

Examples:
  pnpm db:parse "./data/roles/*.html"
  pnpm db:parse ./data/roles/backend-senior.html
`);
    process.exit(1);
  }

  // Resolve glob patterns
  let files: string[] = [];
  for (const pattern of args) {
    const matches = await glob(pattern, { absolute: true });
    files = files.concat(matches);
  }

  files = files.filter((f) => f.endsWith(".html") || f.endsWith(".htm"));

  if (files.length === 0) {
    console.error("❌ No HTML files found.");
    process.exit(1);
  }

  console.log(`\n🚀 Career Universe - Role Parser`);
  console.log(`   Found ${files.length} HTML file(s)\n`);
  console.log("─".repeat(50));

  let success = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const html = fs.readFileSync(file, "utf-8");
      const filename = path.basename(file, path.extname(file));
      const parsed = parseHTML(html, filename);
      await seedRole(parsed);
      success++;
    } catch (error) {
      console.error(`\n❌ Error processing ${path.basename(file)}:`, error);
      errors++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(`\n✅ Done: ${success} processed, ${errors} errors`);

  const [roles, skills, softSkills] = await Promise.all([
    prisma.role.count(),
    prisma.skill.count(),
    prisma.softSkill.count(),
  ]);

  console.log(`\n📊 Database:`);
  console.log(`   Roles:       ${roles}`);
  console.log(`   Skills:      ${skills}`);
  console.log(`   Soft Skills: ${softSkills}\n`);
}

main()
  .catch((e) => {
    console.error("Fatal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

/**
 * HTML Parser für Rollen-Profile
 * Extrahiert Responsibilities, Skills und Level aus Trax HTML-Snippets
 *
 * Verwendet cheerio für robustes HTML-Parsing
 */

import * as cheerio from "cheerio";

export interface ParsedSkill {
  title: string;
  competenceField: string;
  minLevel: number; // 1-4 (Learner, Practitioner, Expert, Master)
}

export interface ParsedRole {
  title: string;
  level: "JUNIOR" | "PROFESSIONAL" | "SENIOR" | "FUNCTIONAL_LEAD" | "HEAD_OF";
  occupationalField: string;
  description?: string;
  team?: string;
  hasLeadership: boolean;
  leadershipType?: string;
  hasBudgetResp: boolean;
  directReportTo?: string;
  responsibilities: string[];
  skills: ParsedSkill[];
  softSkills: string[];
}

/**
 * Erkennt das Level und Leadership-Eigenschaften aus dem Level-Text
 */
function detectRoleLevel(levelText: string): {
  level: ParsedRole["level"];
  hasLeadership: boolean;
  leadershipType?: string;
  hasBudgetResp: boolean;
} {
  const text = levelText.toLowerCase().trim();

  if (text.includes("functional lead")) {
    return {
      level: "FUNCTIONAL_LEAD",
      hasLeadership: true,
      leadershipType: "Functional",
      hasBudgetResp: false,
    };
  }

  if (text.includes("head of") || text === "head") {
    return {
      level: "HEAD_OF",
      hasLeadership: true,
      leadershipType: "Disciplinary",
      hasBudgetResp: true,
    };
  }

  if (text.includes("senior")) {
    return {
      level: "SENIOR",
      hasLeadership: false,
      hasBudgetResp: false,
    };
  }

  if (text.includes("junior")) {
    return {
      level: "JUNIOR",
      hasLeadership: false,
      hasBudgetResp: false,
    };
  }

  // Default: Professional
  return {
    level: "PROFESSIONAL",
    hasLeadership: false,
    hasBudgetResp: false,
  };
}

/**
 * Extrahiert das Occupational Field aus dem HTML
 */
function extractOccupationalField($: cheerio.CheerioAPI): string {
  // Methode 1: Suche nach "Category" Header und folgendem Link
  let category: string | null = null;

  $("h3").each((_, el) => {
    const headerText = $(el).text().toLowerCase().trim();
    if (headerText.includes("category") || headerText.includes("kategorie")) {
      const nextLink = $(el).next().find("a, .trax-link").first();
      if (nextLink.length) {
        category = nextLink.text().trim();
        return false;
      }
      const parentLink = $(el).parent().find("a, .trax-link").first();
      if (parentLink.length) {
        category = parentLink.text().trim();
        return false;
      }
    }
  });

  if (category) return category;

  // Methode 2: Suche nach .trax-role-page-category
  const categoryEl = $(".trax-role-page-category a, .trax-role-page-category .trax-link").first();
  if (categoryEl.length) {
    return categoryEl.text().trim();
  }

  return "General";
}

/**
 * Extrahiert "Direct report to" aus dem HTML
 */
function extractDirectReportTo($: cheerio.CheerioAPI): string | undefined {
  let directReportTo: string | undefined;

  // Methode 1: Suche nach h3 "Direct report to" und extrahiere Link oder Text
  $("h3").each((_, el) => {
    const headerText = $(el).text().toLowerCase().trim();
    if (headerText.includes("direct report to") || headerText.includes("reports to")) {
      const nextEl = $(el).next();

      // Prüfe auf Link im nächsten Element
      const link = nextEl.find("a, .trax-link").first();
      if (link.length) {
        directReportTo = link.text().trim();
        return false;
      }

      // Prüfe auf Link direkt nach h3
      if (nextEl.is("a, .trax-link")) {
        directReportTo = nextEl.text().trim();
        return false;
      }

      // Fallback: Plain text im nächsten .trax-paragraph
      if (nextEl.hasClass("trax-paragraph") || nextEl.find(".trax-paragraph").length) {
        const text = nextEl.text().trim();
        if (text && text.toLowerCase() !== "no") {
          directReportTo = text;
          return false;
        }
      }
    }
  });

  // Fallback: .trax-link nach "report" Text
  if (!directReportTo) {
    $(".trax-link, a").each((_, el) => {
      const parentText = $(el).parent().text().toLowerCase();
      if (parentText.includes("report")) {
        directReportTo = $(el).text().trim();
        return false;
      }
    });
  }

  return directReportTo;
}

/**
 * Extrahiert Leadership-Status aus dem HTML
 * Unterstützt: "No", "Yes - Functional", "Yes - Disciplinary"
 */
function extractLeadership($: cheerio.CheerioAPI): {
  hasLeadership: boolean;
  leadershipType?: string;
} {
  let hasLeadership = false;
  let leadershipType: string | undefined;

  $("h3").each((_, el) => {
    const headerText = $(el).text().toLowerCase().trim();
    if (headerText === "leadership") {
      const nextEl = $(el).next();
      const checkerText = nextEl.find(".trax-role-page-user-info-checker__text").text().trim();

      if (checkerText.toLowerCase().startsWith("yes")) {
        hasLeadership = true;
        // Extract type: "Yes - Functional" -> "Functional"
        const match = checkerText.match(/yes\s*-\s*(.+)/i);
        if (match) {
          leadershipType = match[1].trim();
        }
      }
      return false;
    }
  });

  return { hasLeadership, leadershipType };
}

/**
 * Extrahiert Budget-Verantwortung aus dem HTML
 */
function extractBudgetResponsibility($: cheerio.CheerioAPI): boolean {
  let hasBudgetResp = false;

  $("h3").each((_, el) => {
    const headerText = $(el).text().toLowerCase().trim();
    if (headerText.includes("budget")) {
      const nextEl = $(el).next();
      const checkerText = nextEl.find(".trax-role-page-user-info-checker__text").text().trim();

      if (checkerText.toLowerCase().startsWith("yes")) {
        hasBudgetResp = true;
      }
      return false;
    }
  });

  return hasBudgetResp;
}

/**
 * Parst ein Trax HTML-Snippet und extrahiert Rollen-Daten
 *
 * Erwartete HTML-Struktur:
 * - .trax-page__title → Titel
 * - .trax-role-page-level__level-name → Level
 * - .trax-role-page-responsibilities li → Responsibilities
 * - .trax-role-page-skill → Skills Container
 *   - .trax-role-page-skill__text → Skill Title
 *   - .trax-role-page-skill__level_X (CSS class) → Level 1-4
 *   - .trax-role-page-skill__footer → Competence Field
 * - .trax-role-page-soft-skills__text → Soft Skills
 */
export function parseRoleHTML(html: string): ParsedRole {
  const $ = cheerio.load(html);

  // --- Role Title ---
  const title = $(".trax-page__title").first().text().trim() || "Untitled Role";

  // --- Level Detection ---
  const levelText = $(".trax-role-page-level__level-name").first().text().trim();
  const levelInfo = detectRoleLevel(levelText || title);

  // --- Leadership & Budget from HTML (override level-based detection) ---
  const leadershipInfo = extractLeadership($);
  const hasBudgetResp = extractBudgetResponsibility($);

  // Use HTML-extracted values if available, otherwise fall back to level-based
  const hasLeadership = leadershipInfo.hasLeadership || levelInfo.hasLeadership;
  const leadershipType = leadershipInfo.leadershipType || levelInfo.leadershipType;

  // --- Occupational Field ---
  const occupationalField = extractOccupationalField($);

  // --- Direct Report To ---
  const directReportTo = extractDirectReportTo($);

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

    const skillTitle = skillEl.find(".trax-role-page-skill__text").text().trim();
    if (!skillTitle) return;

    // Level aus CSS-Klasse: trax-role-page-skill__level_X
    let minLevel = 1;
    const classList = skillEl.attr("class") || "";
    const levelMatch = classList.match(/trax-role-page-skill__level_(\d)/);
    if (levelMatch) {
      minLevel = parseInt(levelMatch[1], 10);
    }

    // Competence Field aus Footer
    let competenceField = skillEl.find(".trax-role-page-skill__footer").text().trim();
    if (!competenceField) {
      competenceField = "General";
    }

    skills.push({
      title: skillTitle,
      competenceField,
      minLevel: Math.min(Math.max(minLevel, 1), 4), // Clamp 1-4
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
    level: levelInfo.level,
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

/**
 * Batch-Parser für mehrere HTML-Strings
 */
export function parseMultipleRoles(htmlFiles: string[]): ParsedRole[] {
  return htmlFiles.map(parseRoleHTML);
}

# Career Universe 2.0 — Complete Role Catalog Seed

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Ziel: Alle fehlenden Rollen aus den 8 Occupational Fields in die DB laden.
>
> Aktueller DB-Stand: 11 Rollen aus 4 JSON-Dateien — es fehlen ~40 Rollen.
> Bekannte Felder: data/roles/ — lies zuerst was dort liegt.

Lies zuerst:
- prisma/schema.prisma (RoleLevel enum, OccupationalField, Role Felder)
- data/roles/*.json (vorhandene Struktur als Template)
- data/hard-skills.json (alle Skill-IDs)
- data/soft-skills.json (Soft Skill IDs)
- scripts/seed/seed-json-roles.ts (bestehender Seeder)

Bestätige nach jeder Phase was erstellt wurde.

---

## PHASE 1 — Soft Skills nachziehen

Das bestehende seed-skills-master.ts ignoriert soft-skills.json.
Öffne scripts/seed/seed-skills-master.ts und ergänze am Ende:

```typescript
// Soft Skills seeden
const softSkillsPath = findFile(['data/soft-skills.json', 'prisma/data/soft-skills.json'])
if (softSkillsPath) {
  const softSkillsData = JSON.parse(fs.readFileSync(softSkillsPath, 'utf-8'))
  const softSkills = softSkillsData.softSkills ?? softSkillsData

  for (const skill of softSkills) {
    await prisma.softSkill.upsert({
      where: { slug: skill.id },
      update: { name: skill.name },
      create: { slug: skill.id, name: skill.name }
    })
  }
  console.log(`✅ ${softSkills.length} Soft Skills geseedet`)
}
```

Passe den Prisma-Modellnamen (softSkill vs SoftSkill) ans Schema an.
Führe aus: `npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed/seed-skills-master.ts`

---

## PHASE 2 — OccupationalFields anlegen

Prüfe ob OccupationalField-Modell im Schema existiert. Falls ja:

```typescript
// In seed-skills-master.ts oder eigenem Skript ergänzen:
const occupationalFields = [
  { slug: 'consulting-strategy',      name: 'Consulting & Strategy' },
  { slug: 'software-engineering',     name: 'Software Engineering' },
  { slug: 'digital-marketing',        name: 'Digital Marketing' },
  { slug: 'product-management',       name: 'Product Management' },
  { slug: 'design',                   name: 'Design' },
  { slug: 'performance-analytics',    name: 'Performance & Analytics' },
  { slug: 'sales',                    name: 'Sales' },
  { slug: 'business-administration',  name: 'Business Administration' },
]

for (const field of occupationalFields) {
  await prisma.occupationalField.upsert({
    where: { slug: field.slug },
    update: {},
    create: field
  })
}
```

---

## PHASE 3 — Fehlende Rollen-JSON-Dateien erstellen

Erstelle alle fehlenden JSON-Dateien in data/roles/ im exakt gleichen Format
wie die bestehenden Dateien (lese ein vorhandenes JSON als Template).

Die Skill-Referenzen (skillId) müssen IDs aus hard-skills.json verwenden.
Für Skills die noch keine traxId haben: verwende den id/slug-Wert direkt.
Soft Skills referenzieren IDs aus soft-skills.json.

### 3a — business-development-manager.json

```json
{
  "roleFamily": "Business Development Manager",
  "occupationalField": "consulting-strategy",
  "team": "Sales & Strategy",
  "levels": [
    {
      "id": "business-development-manager-junior",
      "slug": "business-development-manager-junior",
      "title": "Business Development Manager (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "sales-presentation-pitching", "level": 1 },
        { "skillId": "lead-management", "level": 1 },
        { "skillId": "gesprachsfuhrung", "level": 1 },
        { "skillId": "angebotserstellung", "level": 1 },
        { "skillId": "solution-selling", "level": 1 },
        { "skillId": "stakeholder-management", "level": 1 },
        { "skillId": "workshop-facilitation", "level": 1 }
      ],
      "softSkills": ["communication", "analytical-thinking", "teamwork"],
      "responsibilities": [
        "Unterstützung bei der Identifikation und Qualifizierung von Leads",
        "Vorbereitung von Angeboten und Präsentationen",
        "Pflege des CRM-Systems"
      ]
    },
    {
      "id": "business-development-manager-professional",
      "slug": "business-development-manager-professional",
      "title": "Business Development Manager (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "sales-presentation-pitching", "level": 2 },
        { "skillId": "lead-management", "level": 2 },
        { "skillId": "gesprachsfuhrung", "level": 2 },
        { "skillId": "angebotserstellung", "level": 2 },
        { "skillId": "solution-selling", "level": 2 },
        { "skillId": "stakeholder-management", "level": 2 },
        { "skillId": "workshop-facilitation", "level": 2 }
      ],
      "softSkills": ["communication", "analytical-thinking", "teamwork", "self-organization"],
      "responsibilities": [
        "Eigenständige Leadgenerierung und Neukundenakquise",
        "Durchführung von Bedarfsanalysen beim Kunden",
        "Erstellung und Verhandlung von Angeboten"
      ]
    },
    {
      "id": "business-development-manager-senior",
      "slug": "business-development-manager-senior",
      "title": "Business Development Manager (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "sales-presentation-pitching", "level": 3 },
        { "skillId": "lead-management", "level": 3 },
        { "skillId": "gesprachsfuhrung", "level": 3 },
        { "skillId": "angebotserstellung", "level": 3 },
        { "skillId": "solution-selling", "level": 3 },
        { "skillId": "stakeholder-management", "level": 3 },
        { "skillId": "workshop-facilitation", "level": 2 },
        { "skillId": "change-management-langfristig", "level": 2 }
      ],
      "softSkills": ["communication", "analytical-thinking", "teamwork", "self-organization", "leadership"],
      "responsibilities": [
        "Strategische Neukundengewinnung und Aufbau langfristiger Kundenbeziehungen",
        "Leitung komplexer Angebotsprozesse",
        "Mentoring von Junior BDMs"
      ]
    },
    {
      "id": "business-development-head-of",
      "slug": "business-development-head-of",
      "title": "Business Development (m/f/d)",
      "level": "Head Of",
      "levelOrder": 4,
      "hasLeadership": true,
      "leadershipType": "Disciplinary",
      "hardSkills": [
        { "skillId": "sales-presentation-pitching", "level": 4 },
        { "skillId": "lead-management", "level": 4 },
        { "skillId": "gesprachsfuhrung", "level": 4 },
        { "skillId": "angebotserstellung", "level": 3 },
        { "skillId": "solution-selling", "level": 4 },
        { "skillId": "stakeholder-management", "level": 4 },
        { "skillId": "workshop-facilitation", "level": 3 },
        { "skillId": "change-management-langfristig", "level": 3 }
      ],
      "softSkills": ["communication", "leadership", "strategic-thinking", "analytical-thinking"],
      "responsibilities": [
        "Gesamtverantwortung für Business Development und Sales-Strategie",
        "Aufbau und Führung des BD-Teams",
        "Verhandlung und Abschluss von Schlüsselkunden"
      ]
    }
  ]
}
```

### 3b — frontend-developer.json (erweitern um fehlende Levels)

Prüfe ob frontend-developer.json bereits Junior + Professional enthält.
Falls ja, ergänze Senior und Functional Lead:

```json
{
  "roleFamily": "Frontend Developer",
  "occupationalField": "software-engineering",
  "team": "Squad",
  "levels": [
    {
      "id": "frontend-developer-junior",
      "slug": "frontend-developer-junior",
      "title": "Frontend Developer (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "html-css", "level": 1 },
        { "skillId": "javascript", "level": 1 },
        { "skillId": "react", "level": 1 },
        { "skillId": "typescript", "level": 1 },
        { "skillId": "testing", "level": 1 },
        { "skillId": "git-hub", "level": 1 }
      ],
      "softSkills": ["communication", "teamwork", "self-organization"]
    },
    {
      "id": "frontend-developer-professional",
      "slug": "frontend-developer-professional",
      "title": "Frontend Developer (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "html-css", "level": 2 },
        { "skillId": "javascript", "level": 2 },
        { "skillId": "react", "level": 2 },
        { "skillId": "typescript", "level": 2 },
        { "skillId": "testing", "level": 2 },
        { "skillId": "git-hub", "level": 2 },
        { "skillId": "web-accessibility", "level": 1 },
        { "skillId": "performance-debugging-optimization", "level": 1 }
      ],
      "softSkills": ["communication", "teamwork", "analytical-thinking"]
    },
    {
      "id": "frontend-developer-senior",
      "slug": "frontend-developer-senior",
      "title": "Frontend Developer (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "html-css", "level": 3 },
        { "skillId": "javascript", "level": 3 },
        { "skillId": "react", "level": 3 },
        { "skillId": "typescript", "level": 3 },
        { "skillId": "testing", "level": 3 },
        { "skillId": "web-accessibility", "level": 2 },
        { "skillId": "performance-debugging-optimization", "level": 2 },
        { "skillId": "web-security", "level": 2 },
        { "skillId": "packages-api-design", "level": 2 }
      ],
      "softSkills": ["communication", "analytical-thinking", "leadership", "teamwork"]
    },
    {
      "id": "frontend-development-functional-lead",
      "slug": "frontend-development-functional-lead",
      "title": "Frontend Development (m/f/d)",
      "level": "Functional Lead",
      "levelOrder": 4,
      "hasLeadership": true,
      "leadershipType": "Functional",
      "hardSkills": [
        { "skillId": "html-css", "level": 3 },
        { "skillId": "javascript", "level": 4 },
        { "skillId": "react", "level": 4 },
        { "skillId": "typescript", "level": 3 },
        { "skillId": "testing", "level": 3 },
        { "skillId": "web-accessibility", "level": 3 },
        { "skillId": "performance-debugging-optimization", "level": 3 },
        { "skillId": "web-security", "level": 3 },
        { "skillId": "packages-api-design", "level": 3 }
      ],
      "softSkills": ["leadership", "communication", "analytical-thinking", "mentoring"]
    }
  ]
}
```

### 3c — content-manager.json

```json
{
  "roleFamily": "Content Manager",
  "occupationalField": "digital-marketing",
  "team": "Marketing Excellence",
  "levels": [
    {
      "id": "content-manager-junior",
      "slug": "content-manager-junior",
      "title": "Content Manager (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "content-erstellung", "level": 1 },
        { "skillId": "content-planung", "level": 1 },
        { "skillId": "seo-basics", "level": 1 },
        { "skillId": "social-media", "level": 1 }
      ],
      "softSkills": ["communication", "creativity", "self-organization"]
    },
    {
      "id": "content-manager-professional",
      "slug": "content-manager-professional",
      "title": "Content Manager (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "content-erstellung", "level": 2 },
        { "skillId": "content-planung", "level": 2 },
        { "skillId": "seo-basics", "level": 2 },
        { "skillId": "social-media", "level": 2 },
        { "skillId": "content-strategie", "level": 1 }
      ],
      "softSkills": ["communication", "creativity", "analytical-thinking", "self-organization"]
    },
    {
      "id": "content-manager-senior",
      "slug": "content-manager-senior",
      "title": "Content Manager (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "content-erstellung", "level": 3 },
        { "skillId": "content-planung", "level": 3 },
        { "skillId": "seo-basics", "level": 3 },
        { "skillId": "social-media", "level": 3 },
        { "skillId": "content-strategie", "level": 2 }
      ],
      "softSkills": ["communication", "creativity", "analytical-thinking", "leadership"]
    },
    {
      "id": "content-strategist-functional-lead",
      "slug": "content-strategist-functional-lead",
      "title": "Content Strategist (m/f/d)",
      "level": "Functional Lead",
      "levelOrder": 4,
      "hasLeadership": true,
      "leadershipType": "Functional",
      "hardSkills": [
        { "skillId": "content-erstellung", "level": 3 },
        { "skillId": "content-planung", "level": 4 },
        { "skillId": "content-strategie", "level": 4 },
        { "skillId": "seo-basics", "level": 3 }
      ],
      "softSkills": ["communication", "leadership", "strategic-thinking", "creativity"]
    }
  ]
}
```

### 3d — performance-marketing-paid.json

```json
{
  "roleFamily": "Performance Marketing Manager - Paid",
  "occupationalField": "digital-marketing",
  "team": "Marketing Excellence",
  "levels": [
    {
      "id": "performance-marketing-paid-junior",
      "slug": "performance-marketing-paid-junior",
      "title": "Performance Marketing Manager - Paid (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "paid-advertising", "level": 1 },
        { "skillId": "google-ads", "level": 1 },
        { "skillId": "tracking-analytics", "level": 1 }
      ],
      "softSkills": ["analytical-thinking", "self-organization"]
    },
    {
      "id": "performance-marketing-paid-professional",
      "slug": "performance-marketing-paid-professional",
      "title": "Performance Marketing Manager - Paid (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "paid-advertising", "level": 2 },
        { "skillId": "google-ads", "level": 2 },
        { "skillId": "tracking-analytics", "level": 2 }
      ],
      "softSkills": ["analytical-thinking", "communication", "self-organization"]
    },
    {
      "id": "performance-marketing-paid-senior",
      "slug": "performance-marketing-paid-senior",
      "title": "Performance Marketing Manager - Paid (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "paid-advertising", "level": 3 },
        { "skillId": "google-ads", "level": 3 },
        { "skillId": "tracking-analytics", "level": 3 }
      ],
      "softSkills": ["analytical-thinking", "communication", "strategic-thinking"]
    }
  ]
}
```

### 3e — performance-marketing-seo.json

```json
{
  "roleFamily": "Performance Marketing Manager - SEO",
  "occupationalField": "digital-marketing",
  "team": "Marketing Excellence",
  "levels": [
    {
      "id": "performance-marketing-seo-junior",
      "slug": "performance-marketing-seo-junior",
      "title": "Performance Marketing Manager - SEO (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "seo-basics", "level": 1 },
        { "skillId": "seo-onpage", "level": 1 },
        { "skillId": "tracking-analytics", "level": 1 }
      ],
      "softSkills": ["analytical-thinking", "self-organization"]
    },
    {
      "id": "performance-marketing-seo-professional",
      "slug": "performance-marketing-seo-professional",
      "title": "Performance Marketing Manager - SEO (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "seo-basics", "level": 2 },
        { "skillId": "seo-onpage", "level": 2 },
        { "skillId": "tracking-analytics", "level": 2 }
      ],
      "softSkills": ["analytical-thinking", "communication", "self-organization"]
    },
    {
      "id": "performance-marketing-seo-senior",
      "slug": "performance-marketing-seo-senior",
      "title": "Performance Marketing Manager - SEO (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "seo-basics", "level": 3 },
        { "skillId": "seo-onpage", "level": 3 },
        { "skillId": "tracking-analytics", "level": 3 }
      ],
      "softSkills": ["analytical-thinking", "communication", "strategic-thinking"]
    }
  ]
}
```

### 3f — digital-analyst.json

```json
{
  "roleFamily": "Digital Analyst",
  "occupationalField": "performance-analytics",
  "team": "Performance & Analytics",
  "levels": [
    {
      "id": "digital-analyst-junior",
      "slug": "digital-analyst-junior",
      "title": "Digital Analyst (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "web-analytics", "level": 1 },
        { "skillId": "tracking-analytics", "level": 1 },
        { "skillId": "data-visualization", "level": 1 }
      ],
      "softSkills": ["analytical-thinking", "self-organization"]
    },
    {
      "id": "digital-analyst-professional",
      "slug": "digital-analyst-professional",
      "title": "Digital Analyst (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "web-analytics", "level": 2 },
        { "skillId": "tracking-analytics", "level": 2 },
        { "skillId": "data-visualization", "level": 2 }
      ],
      "softSkills": ["analytical-thinking", "communication", "self-organization"]
    },
    {
      "id": "digital-analyst-senior",
      "slug": "digital-analyst-senior",
      "title": "Digital Analyst (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "web-analytics", "level": 3 },
        { "skillId": "tracking-analytics", "level": 3 },
        { "skillId": "data-visualization", "level": 3 }
      ],
      "softSkills": ["analytical-thinking", "communication", "strategic-thinking"]
    }
  ]
}
```

### 3g — hr.json (Business Administration)

```json
{
  "roleFamily": "HR",
  "occupationalField": "business-administration",
  "team": "People & Culture",
  "levels": [
    {
      "id": "hr-coordinator-junior",
      "slug": "hr-coordinator-junior",
      "title": "HR Coordinator (m/f/d)",
      "level": "Junior",
      "levelOrder": 1,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "personaladministration", "level": 1 },
        { "skillId": "recruiting", "level": 1 },
        { "skillId": "personalmarketing", "level": 1 }
      ],
      "softSkills": ["communication", "self-organization", "teamwork"]
    },
    {
      "id": "hr-manager-professional",
      "slug": "hr-manager-professional",
      "title": "HR Manager (m/f/d)",
      "level": "Professional",
      "levelOrder": 2,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "personaladministration", "level": 2 },
        { "skillId": "recruiting", "level": 2 },
        { "skillId": "personalmarketing", "level": 2 },
        { "skillId": "personalentwicklung", "level": 1 },
        { "skillId": "personalplanung-organisation", "level": 1 }
      ],
      "softSkills": ["communication", "analytical-thinking", "self-organization", "teamwork"]
    },
    {
      "id": "hr-business-partner-senior",
      "slug": "hr-business-partner-senior",
      "title": "HR Business Partner (m/f/d)",
      "level": "Senior",
      "levelOrder": 3,
      "hasLeadership": false,
      "hardSkills": [
        { "skillId": "personalentwicklung", "level": 3 },
        { "skillId": "personalplanung-organisation", "level": 3 },
        { "skillId": "recruiting", "level": 3 },
        { "skillId": "compensation-benefits", "level": 2 },
        { "skillId": "personalmarketing", "level": 2 }
      ],
      "softSkills": ["communication", "leadership", "strategic-thinking", "analytical-thinking"]
    }
  ]
}
```

### 3h — head-of-development.json

```json
{
  "roleFamily": "Head Of Development",
  "occupationalField": "software-engineering",
  "team": "Squad",
  "levels": [
    {
      "id": "head-of-development",
      "slug": "head-of-development",
      "title": "Head Of Development (m/f/d)",
      "level": "Head Of",
      "levelOrder": 5,
      "hasLeadership": true,
      "leadershipType": "Disciplinary",
      "hardSkills": [
        { "skillId": "system-software-architecture", "level": 4 },
        { "skillId": "programming-fundamentals", "level": 3 },
        { "skillId": "solid-principles-guidelines", "level": 4 },
        { "skillId": "domain-driven-development", "level": 3 },
        { "skillId": "stakeholder-management", "level": 3 }
      ],
      "softSkills": ["leadership", "strategic-thinking", "communication", "analytical-thinking"]
    }
  ]
}
```

### 3i — team-lead-squad.json

```json
{
  "roleFamily": "Team Lead Digital Solution Delivery",
  "occupationalField": "product-management",
  "team": "Squad",
  "levels": [
    {
      "id": "team-lead-digital-solution-delivery",
      "slug": "team-lead-digital-solution-delivery",
      "title": "Team Lead Digital Solution Delivery - Squad Lead (m/f/d)",
      "level": "Team Lead",
      "levelOrder": 4,
      "hasLeadership": true,
      "leadershipType": "Disciplinary",
      "hardSkills": [
        { "skillId": "stakeholder-management", "level": 3 },
        { "skillId": "workshop-facilitation", "level": 3 },
        { "skillId": "product-requirement", "level": 3 },
        { "skillId": "change-management-langfristig", "level": 2 }
      ],
      "softSkills": ["leadership", "communication", "strategic-thinking", "teamwork"]
    }
  ]
}
```

---

## PHASE 4 — Seeder auf OccupationalField-Mapping erweitern

Öffne scripts/seed/seed-json-roles.ts und prüfe ob er das Feld
`occupationalField` aus den JSON-Dateien verarbeitet.

Falls nicht, ergänze die Logik:

```typescript
// Nach dem Erstellen der Rolle:
if (roleData.occupationalField && role) {
  const field = await prisma.occupationalField.findUnique({
    where: { slug: roleData.occupationalField }
  })
  if (field) {
    await prisma.role.update({
      where: { id: role.id },
      data: { occupationalFieldId: field.id }  // Feldname ans Schema anpassen
    })
  }
}
```

---

## PHASE 5 — Seed ausführen und validieren

```bash
# Zuerst Skills sicherstellen
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed/seed-skills-master.ts

# Dann Rollen seeden
npx prisma db seed

# Ergebnis prüfen
npx ts-node --compiler-options '{"module":"CommonJS"}' -e "
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const roles = await p.role.findMany({
    select: { title: true, level: true },
    orderBy: [{ title: 'asc' }]
  })
  console.log('=== ROLES IN DB ===')
  console.log('Total:', roles.length)
  roles.forEach(r => console.log(' ', r.title, '[' + r.level + ']'))
}
main().catch(console.error).finally(() => p.\$disconnect())
"
```

Erwartetes Ergebnis nach vollständigem Seed:
- ~50+ Rollen in DB
- Alle 8 Occupational Fields vorhanden
- 108 Hard Skills + 24 Soft Skills

---

## PHASE 6 — Skill-ID Konflikte auflösen

Wenn der Seeder Warnungen ausgibt wie "Skill nicht gefunden: seo-basics",
prüfe die exakten IDs in hard-skills.json:

```bash
cat data/hard-skills.json | grep -i '"id"' | grep -i seo
cat data/hard-skills.json | grep -i '"id"' | grep -i paid
cat data/hard-skills.json | grep -i '"id"' | grep -i content
```

Passe die skillId-Werte in den JSON-Dateien an die tatsächlichen IDs an.
Die IDs in hard-skills.json sind die Quelle der Wahrheit — nicht die
Skill-Namen.

---

## PHASE 7 — Commit

```bash
git add data/roles/
git add scripts/seed/
git commit -m "feat: complete role catalog — all 8 occupational fields seeded

Added missing role families:
- business-development-manager (4 levels: Junior→Head Of)
- frontend-developer (completed: Senior + Functional Lead)
- content-manager + content-strategist (4 levels)
- performance-marketing-paid (3 levels)
- performance-marketing-seo (3 levels)
- digital-analyst (3 levels)
- hr (3 levels: Coordinator, Manager, Business Partner)
- head-of-development (1 level)
- team-lead-digital-solution-delivery (1 level)

Also: soft skills seeder fixed (24 soft skills now in DB)
OccupationalField mapping added to role seeder"

git push origin main
```

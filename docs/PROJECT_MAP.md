# Career Universe 2.0 — Project Map

Stand: 2026-04-22. Re-Orientierungs-Dokument für Rückkehr ins Projekt
nach Wochen Pause.

## Routes Overview

### Public (kein Auth-Guard)
- `/auth/login` — Supabase Magic-Link + Password Login
- `/auth/register` — Registrierung
- `/auth/callback` — Supabase Auth Callback (Route Handler)

### Legacy / Duplicate (TODO: bereinigen)
- `/login` — Eigene animierte Login-Seite (parallel zu /auth/login)
- `/dashboard` — Altes Dashboard mit OnboardingWizard (ersetzt durch /)

### Authenticated
- `/` — **"Mein Tag"-Dashboard** — Streak, Next Steps, Path Snapshot,
  Week Stats, Admin Responsibilities (Pass 2d-iii)
- `/profile` — Mein Profil + Admin-/Domain-Expert-Modi mit Mode-Toggle
- `/my-career` — Rollen-Explorer + Skill-Balance Radar
- `/my-career/compare` — Rollen-Vergleich (Jaccard)
- `/learning-journey` — Impuls-basiertes Lernen mit AI Mentor
- `/timeline` — Karriere-Timeline mit Evidence-Events
- `/admin/validations` — Pending Evidence-Validierungen (Admin/FL only)
- `/admin/dashboard` — Admin-Cockpit (legacy, nicht mehr aktiv gepflegt)
- `/design-system` — Living Styleguide

### API Routes
- `/api/career/mentor` — POST: AI Mentor chat (Haiku 4.5, rate-limited)
- `/api/career/analyze` — GET: Gap-Analyse für Ziel-Rolle
- `/api/skills` — CRUD für Skills

## Data Services (`src/lib/services/`)

| Datei | Zweck |
|---|---|
| `dashboard.ts` | Streak, Next Steps, Week Stats, Path Snapshot (für /) |
| `evidence-timeline.ts` | Evidence CRUD, Validation, Timeline-Events |
| `assessment-history.ts` | Skill-Assessment Audit-Trail |
| `mentor-chat.ts` | AI Mentor Advice + Evidence Nudge (Anthropic SDK) |
| `career-logic.ts` | Gap-Analyse, Jaccard-Similarity, Role-Matching |
| `modern-impulse-generator.ts` | Lern-Impuls-Generierung (Stub) |
| `skill-enrichment.ts` | Skill-Metadata-Anreicherung (Stub) |
| `smart-resources.ts` | Ressourcen-Empfehlungen (Stub) |
| `personalized-pathways.ts` | Personalisierte Karrierepfade |
| `index.ts` | Re-Exports |

## Server Actions (`src/app/actions/`)

| Datei | Zweck |
|---|---|
| `skill-management.ts` | Skill CRUD per CompetenceField |
| `role-management.ts` | Role CRUD + RoleSkill-Verknüpfungen |
| `career-path-management.ts` | CareerPath CRUD (Transitions) |
| `user-sync.ts` | Supabase-User → Prisma-User Sync |
| `auth.ts` | Login/Logout-Hilfsfunktionen, `getCurrentUser` |
| `get-roles.ts` | Grouped-Roles für Role-Selector |
| `ai-impulse.ts` | AI Impuls-Generierung |
| `learning-journey.ts` | Journey-Progress Actions |
| `feedback.ts` | Feedback-Submission |
| `skill-enhancement.ts` | (legacy) |
| `admin-analytics.ts` | Admin-Cockpit-Daten |

## Auth (`src/lib/auth/`)

- `require-user.ts` — Server-side User-Fetch, wirft wenn nicht authentifiziert
- `permissions.ts` — `isAdmin`, `isDomainExpert`, `canManageRoles/Team/…`
- `src/middleware.ts` — Route-Protection via Supabase-Cookie-Check
- `src/lib/supabase/middleware.ts` — SSR-Cookie-Helper

## Component Libraries

### Layout Primitives (`src/components/layout/`)
- `PageShell`, `PageHeader`, `Section`, `Card`
- `Button` (5 variants × 3 sizes)
- `Status` (pill/inline/banner)

### Shared (`src/components/shared/`)
- `Navigation` — Dark-Nav (Convidera-Charcoal) mit Mobile-Drawer
- `ValidationBadge` — Async Count-Badge (Pending Validations)

### Feature Components
- `src/components/dashboard/` — StreakGrid, NextStepsCard, PathSnapshotCard,
  WeekStatsCard, AdminResponsibilitiesCard, DashboardGreeting
- `src/components/evidence/` — EvidenceDialog, EvidenceTimeline,
  ValidationPanel, ValidationPanelWrapper, SkillProgressBar,
  TimelineExportButton
- `src/components/admin/` — RolesManagementPanel, CareerPathsPanel,
  RolesAndPathsTabs
- `src/components/skill-tree/` — SkillTreeEditor
- `src/components/learning-journey/` — LearningJourneyView + Sub-Komponenten
- `src/components/my-career/` — MyCareerView + Sub-Komponenten
- `src/components/career/` — Career-Flow-Komponenten
- `src/components/feedback/` — Beta-Feedback-Button
- `src/components/providers/` — Context Provider (Auth, Toast, …)

## Design System

- `src/lib/design-tokens.ts` — TypeScript Token-Quelle
- `src/app/globals.css` — CSS Variables (`:root`)
- `tailwind.config.ts` — Tailwind-spezifische Mapping
- `/design-system` Route — Living Styleguide (Admin-gated)

## Data Sources

### Code-Controlled
- `data/skills/hard-skills.json` — 108 Hard Skills in 20 Competence Fields
- `data/skills/soft-skills.json` — 45 Soft Skills (v1.1 Master)
- `data/roles/*.json` — 14 Role-Family-JSONs → 41 Rollen total:
  backend-developer, business-development-manager, consultant,
  content-manager, digital-analyst, digital-marketing-manager,
  frontend-developer, head-of-development, hr, performance-marketing-paid,
  performance-marketing-seo, product-designer, product-owner,
  team-lead-squad

### Seeders (`scripts/seed/`)
- `seed-skills-master.ts` — Hard + Soft Skills aus JSON-Master
- `seed-json-roles.ts` — Rollen + RoleSkill-Verknüpfungen
- `parser.ts`, `parseRoleHTML.ts` — HTML-Import-Helfer
- `transformToSeed.ts`, `validate-role-json.ts` — Tooling
- `export-skills-to-master.ts` — DB → JSON Reverse-Seeder
- `seed.ts` — Top-Level-Seed

### Maintenance (`scripts/maintenance/`)
- `cleanup-legacy-softskills.ts` — Safety-net DELETE für Nicht-Master-Slugs

## Prisma Schema

Haupt-Modelle:
- `User`, `Role`, `Skill`, `SoftSkill`, `CompetenceField`, `OccupationalField`
- `RoleSkill`, `Responsibility`, `CareerPath`
- `SkillAssessment`, `CareerGoal`, `LearningPlan`, `LearningFocus`
- `Evidence`, `ValidationEvent`, `TimelineEvent`, `AssessmentHistory`
- `UserSkillEvidence`, `PracticalImpulse`, `EvidenceNote`
- `ActivityLog`, `Feedback`, `SkillValidationConfig`, `TimelineEntry`

Enums:
- `PlatformRole` (USER | FUNCTIONAL_LEAD | ADMIN)
- `RoleLevel` (JUNIOR | PROFESSIONAL | SENIOR | FUNCTIONAL_LEAD |
  TEAM_LEAD | HEAD_OF)
- `AssessmentStatus` (SELF_ASSESSED | EVIDENCE_SUBMITTED | VALIDATED)
- `CareerGoalStatus` (EXPLORING | COMMITTED | ACHIEVED | ABANDONED)
- `EvidenceType`, `ValidationStatus`, `AssessmentType`
- `FocusPriority`, `FocusStatus`, `ImpulseLevel`, `ImpulseStep`
- `ActivityType`

## Environment

### Dev
- Node 20+
- `pnpm` (primäres Lockfile) + `npm` (fallback)
- `tsx` für TypeScript-Scripts (kein `ts-node` installiert)
- `.env` mit `DATABASE_URL` (pooler, port 6543) + `DIRECT_URL` (direct, 5432)
- Supabase: Projekt `laflrjhespxnmscilsbp` (EU-Central-1)

### Production
- Vercel Deploy aus `main` → `convidera-career-universe.vercel.app`
- Next.js 16.1.6 mit Turbopack
- Anthropic API Key für Mentor/Nudge (server-only, kein NEXT_PUBLIC_)

## Codebase-Stats (2026-04-22)

| Bereich | LOC |
|---|---|
| Components (src/components/**/*.tsx) | 5'621 |
| App-Routes (src/app/**/*.{ts,tsx}) | 11'518 |
| Actions (src/app/actions/*.ts) | 3'169 |
| Services (src/lib/services/*.ts) | 2'020 |

Dependencies: 14 prod + 12 dev.

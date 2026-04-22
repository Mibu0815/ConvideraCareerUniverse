# Career Universe 2.0 — Session Log

## 2026-04-20 bis 2026-04-22 — MVP → Design-aligned App

Diese Transformation umfasst 21 Commits über drei Tage. Start: funktional
rudimentäres MVP mit generischem Layout und 11 Rollen. Ende: Convidera-aligned
Design-System, einheitliche Dark-Navigation, neues "Mein Tag"-Dashboard,
Role-Katalog mit 41 Rollen über 7 Occupational Fields.

### Ausgangszustand (20. April, morgens)
- 11 Rollen, 24 Soft Skills in DB (veralteter JSON-Seed)
- /profile als Single-Form-View ohne Admin-Modi
- Keine einheitliche Navigation (jede Route eigene Variante)
- Fehlendes Dashboard (/, /dashboard mit OnboardingWizard als Legacy)
- Keine Evidence-Timeline, keine Validation-Routen
- CSP erlaubte api.anthropic.com client-seitig (Security-Schwäche)

### End-Zustand (22. April, abends)
- **41 Rollen** über 7 Occupational Fields (Product, Engineering, Design,
  Marketing, HR, Sales/BizDev, Leadership)
- **108 Hard Skills** in 20 Competence Fields, davon 3 mit Domain-Experte
- **45 Soft Skills** (nach Legacy-Cleanup von 84 → 45)
- **414 Role↔Skill-Verknüpfungen**
- **2 Career Paths** (erste Transitions seeded)
- Einheitliche Dark-Navigation (Convidera-Charcoal) mit Mobile-Drawer
- "Mein Tag"-Dashboard (/) mit Streak, Next Steps, Path Snapshot, Week Stats
- Admin-Profil mit Roles/Paths/Team-Tabs, inline Skill-Tree-Editor
- /admin/validations Route, ValidationBadge in Navigation
- CSP gehärtet (nur 'self' https://*.supabase.co in connect-src)
- Rate Limiting auf Mentor-API
- Living Styleguide unter /design-system

### Hauptarbeiten chronologisch

#### 20. April — Foundation & Content (14 Commits)
- `387602c` Supabase auth flow — login, register, callback, middleware
- `99d2469` feat: my-career page, onboarding role selector, profile, navigation update
- `60a1c7b` feat: assessment history, impulse generator, skill enrichment, smart resources
- `d9a7622` **security+schema**: CSP fix, Evidence/AssessmentHistory models, rate limiting
- `ece1d8f` feat: dual-role profile pages with skill tree editor
- `019f259` fix: complete soft-skills.json with all 45 master entries
- `d3467a9` fix: seed-skills-master uses fieldId (schema) instead of competenceFieldId
- `4ebeaf1` chore: add cleanup script for legacy soft skills (39 removed, 84 → 45)
- `6a2c843` docs: CLI prompts for review, evidence timeline, role seed
- `d1a7195` chore: remove obsolete root middleware.ts (moved to src/)
- `61f2714` feat: wire ValidationBadge into Navigation call sites
- `0896433` perf: use Haiku 4.5 for evidence nudges (3x cheaper)
- `eb9501c` feat: **role catalog — 37 roles across 8 occupational fields**
- `4288dce` chore: add TEAM_LEAD enum, cleanup empty Sales OF (→ 7 OFs)
- `cb03c75` feat: add Product Designer role family (4 levels)
- `24dc2a6` fix: Navigation on /admin/validations + debug logs for profile toggle
- `dc3c5a5` feat: interactive skill tree editor in admin management
- `c5ee76e` feat: full CRUD for roles and career paths in admin profile

#### 21. April — Design Foundation (4 Commits)
- `17b0e5e` fix: restore TRAX-accurate skill levels for Performance Marketing Paid
- `41d60c4` feat(design): **phase 1 — design foundation** (tokens, layout primitives)
- `9549bb8` feat(design): foundation polish — Button + Status + radius examples
- `01eebbf` feat(nav): **pass 2a — dark navigation + mobile drawer**
- `19a9d55` feat(design): pass 2b — PageShell on Timeline + Admin-Validations
- `e458c1b` fix: navigation polish — logo clipping, indicator centering, floating bar

#### 22. April — Dashboard Redesign (3 Commits)
- `87586af` fix: **unify navigation** — dashboard now uses shared dark nav
- `11260f0` feat(dashboard): **pass 2d-i + 2d-ii** — services + components (no switch)
- `0539ef7` feat(dashboard): **pass 2d-iii** — switch + cleanup

### Key Learnings

- **Prisma Relations in PascalCase**: Schema nutzt `FromRole`/`ToRole`, nicht
  `fromRole`/`toRole`. Viele initiale TypeScript-Fehler kamen aus dieser
  Konvention (siehe auch `User.CareerGoal` statt `careerGoals`, `User.Evidence`
  statt `evidences`).
- **Enum-Werte lesen aus dem Schema, nicht aus dem Gefühl**: `CareerGoalStatus`
  hat kein `ACTIVE` — nur `EXPLORING | COMMITTED | ACHIEVED | ABANDONED`.
  `AssessmentStatus` → `SELF_ASSESSED | EVIDENCE_SUBMITTED | VALIDATED`.
- **`Skill.title` statt `Skill.name`**, `CompetenceField.title` statt `.name`.
  Schema ist Quelle der Wahrheit, Prompt-Snippets sind es nicht.
- **Zwei FUNCTIONAL_LEAD-Enums**: `RoleLevel` (Karriere-Level) ≠ `PlatformRole`
  (Plattform-Berechtigung). Bei Rename-Plänen strikt trennen.
- **DB ≠ JSON-Source**: Iterative Seeds können die DB über den JSON-Stand
  hinaus wachsen lassen (84 Soft Skills bei nur 24 in JSON → Legacy-Cleanup nötig).
- **`'use server'` nicht verschwenderisch einsetzen**: Reine Server-Libs
  (die nur aus Server Components importiert werden) dürfen es **nicht** haben —
  das würde sie in RPC-Endpunkte umwandeln. Nur Dateien mit Server Actions.

### Architektur-Entscheidungen

**Design Tokens**: `src/lib/design-tokens.ts` + CSS Variables in
`src/app/globals.css` + `tailwind.config.ts`. Drei Repräsentationen,
eine Quelle der Wahrheit.

**Layout-Primitives**: `src/components/layout/` — `PageShell`, `PageHeader`,
`Section`, `Card`, `Button`, `Status`. Alle neuen Pages nutzen diese
statt eigener Layout-Patterns.

**Navigation**: Geteilte `src/components/shared/Navigation.tsx` — Dark Charcoal,
Sticky, Mobile-Drawer. `ValidationBadge` als Async Server Component
eingebunden für live Count.

**Dashboard-Daten**: 5 Funktionen in `src/lib/services/dashboard.ts`
(Streak, Next Steps, Path Snapshot, Week Stats, Admin Responsibilities).
Alle parallelisierbar via `Promise.all`.

**Activity-Streak**: Quelle ist `ActivityLog` (nicht `TimelineEvent`),
weil dort granularere Events geloggt werden.

**Rollen-Management**: Als Admin-only UI in `/profile` → „Plattform-Verwaltung",
mit CRUD für Roles, Skills, Career Paths. Initial-Seed via `data/roles/*.json`,
danach UI-editierbar.

**Auth**: Supabase Magic Link + Password. Middleware in `src/middleware.ts`
+ Supabase-Cookie-Handling in `src/lib/supabase/middleware.ts`. `User.id` =
Supabase Auth ID (kein separates `supabaseId`-Feld).

### Offene Punkte

- [ ] E2E-Test: Evidence einreichen → validieren → Timeline verifizieren
- [ ] Phase 3: Empty States für Timeline, Validations, WeekStats
- [ ] Phase 4: Mobile-Polish (Drawer-Animation, Touch-Targets)
- [ ] Altlasten bereinigen: `/login` vs `/auth/login`, `/` vs `/dashboard`
  (alte OnboardingWizard-Route) — entscheiden ob migrieren oder löschen
- [ ] `src/app/profile/ProfileForm.tsx` (alte Form, nicht mehr importiert) löschen
- [ ] Karrierepfade manuell seeden (aktuell nur 2)
- [ ] 17 Kompetenzfelder ohne Domain-Experten zuweisen
- [ ] AI Mentor Prompt-Tuning für kontextuellere Vorschläge
- [ ] Landing-Page für nicht-eingeloggte User (statt direkter Redirect)

### DB-Snapshot (2026-04-22, abends)

```json
{
  "users": 1,               "admins": 1,
  "domainExperts": 0,       "competenceFieldsWithOwner": 3,
  "occupationalFields": 7,  "competenceFields": 20,
  "roles": 41,              "roleSkills": 414,
  "skills": 108,            "softSkills": 45,
  "careerPaths": 2,         "activityLog": 8,
  "evidences": 0,           "timelineEvents": 0,
  "skillAssessments": 0,    "careerGoals": 0
}
```

Rollen pro Level: JUNIOR 11 · PROFESSIONAL 11 · SENIOR 12 ·
FUNCTIONAL_LEAD 4 · TEAM_LEAD 1 · HEAD_OF 2.

User-Content (Evidences, Timeline, Assessments, Goals) ist 0 —
die App hatte noch keinen echten Nutzer-Traffic.

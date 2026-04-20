# Career Universe 2.0 — Full Code & Functional Review

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Ziel: Alle Änderungen der letzten Sessions verifizieren, 503-Fehler auf /profile diagnostizieren.

## KRITISCHE ERKENNTNIS VORAB
Die Live-App https://convidera-career-universe.vercel.app liefert auf /profile
HTTP 503 (Service Unavailable). Das muss diese Session gelöst werden.

Arbeite die Checks in Reihenfolge ab, stoppe bei jedem Fehler und berichte.

---

## TEIL 1 — Git & Deployment State

```bash
cd /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
git pull origin main
git log --oneline -20
git status
```

Erwartetes Ergebnis:
- clean working tree
- Letzter Commit: Soft-Skills Cleanup oder Nachpatch
- Keine uncommitted changes

Prüfe ob alle heute diskutierten Features in der Commit-History auftauchen:
- "security+schema" Commit (CSP fix, Evidence models)
- "Supabase auth flow" Commit
- "assessment history" oder "dual-role profile" Commit
- "soft skills" / "legacy cleanup" Commits

Liste die 10 letzten Commits mit Autor und Datum.

---

## TEIL 2 — Prisma Schema Validierung

```bash
npx prisma validate
npx prisma format
```

Dann prüfe ob das Schema alle erwarteten Modelle enthält:

```bash
grep -E "^model |^enum " prisma/schema.prisma
```

Erwartet mindestens:
- model User, Role, Skill, SoftSkill, CompetenceField
- model SkillAssessment, CareerGoal, ActivityLog
- model Evidence, ValidationEvent, TimelineEvent, AssessmentHistory
- enum PlatformRole, RoleLevel, AssessmentStatus, AssessmentType, GoalStatus

Falls eines fehlt: Melden, nicht fixen — erst den User fragen.

---

## TEIL 3 — Prisma Client & TypeScript

```bash
npx prisma generate
npx tsc --noEmit 2>&1 | head -50
```

Erwartetes Ergebnis: 0 TypeScript-Fehler.
Falls Fehler auftauchen: Auflisten, markieren welche neu sind.

---

## TEIL 4 — Datenbank-Inhalt verifizieren

Erstelle ein temporäres Audit-Skript:

```typescript
// /tmp/db-audit.ts
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const counts = {
    users: await prisma.user.count(),
    admins: await prisma.user.count({ where: { platformRole: 'ADMIN' } }),
    domainExperts: await prisma.user.count({
      where: { platformRole: { in: ['FUNCTIONAL_LEAD', 'DOMAIN_EXPERT' as any] } }
    }),
    members: await prisma.user.count({
      where: { platformRole: { in: ['USER', 'MEMBER' as any] } }
    }),
    competenceFields: await prisma.competenceField.count(),
    skills: await prisma.skill.count(),
    softSkills: await prisma.softSkill.count(),
    roles: await prisma.role.count(),
    rolesByLevel: await prisma.role.groupBy({
      by: ['level'], _count: { _all: true }
    }),
    skillAssessments: await prisma.skillAssessment.count(),
    evidences: await prisma.evidence.count(),
    timelineEvents: await prisma.timelineEvent.count(),
    assessmentHistory: await prisma.assessmentHistory.count(),
  }

  console.log(JSON.stringify(counts, null, 2))

  // Ownership-Check: Competence Fields ohne Owner
  const orphanFields = await prisma.competenceField.findMany({
    where: { ownerId: null } as any,
    select: { name: true, slug: true }
  })
  console.log('\nFields ohne Owner:', orphanFields.length)
  orphanFields.forEach(f => console.log(`  ${f.slug}: ${f.name}`))

  // Rollen ohne Skills
  const rolesNoSkills = await prisma.role.findMany({
    where: { requiredSkills: { none: {} } },
    select: { slug: true, title: true }
  })
  console.log('\nRollen ohne Skills:', rolesNoSkills.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

Ausführen:
```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' /tmp/db-audit.ts
```

Erwartete Werte (aus unseren Sessions):
- softSkills: 45 (nach Legacy-Cleanup)
- skills: 108
- competenceFields: 20
- roles: 11 (aktuell) oder 40+ (nach complete-role-seed)
- evidences: 0 (keine Test-Daten)

Dokumentiere die tatsächlichen Werte.

---

## TEIL 5 — Datei-Existenz & Struktur

Prüfe ob alle erwarteten Dateien aus den CLI-Prompts existieren:

```bash
ls -la src/app/profile/
ls -la src/app/profile/sections/ 2>/dev/null
ls -la src/app/admin/validations/ 2>/dev/null
ls -la src/app/api/career/mentor/
ls -la src/lib/services/
ls -la src/lib/auth/
ls -la src/lib/constants/ 2>/dev/null
ls -la src/lib/supabase/
ls -la src/middleware.ts
ls -la data/roles/
ls -la data/skills/ 2>/dev/null || ls -la data/
ls -la scripts/seed/
```

Erwartete Dateien:
- src/app/profile/page.tsx
- src/app/profile/ProfileClient.tsx
- src/app/profile/sections/PersonalDevelopmentSection.tsx
- src/app/profile/sections/DomainExpertSection.tsx
- src/app/profile/sections/AdminManagementSection.tsx
- src/app/actions/skill-management.ts
- src/lib/services/assessment-history.ts
- src/lib/services/evidence-timeline.ts
- src/lib/services/mentor-chat.ts
- src/lib/services/career-logic.ts (mit Jaccard 0.4 + normalizeWords)
- src/lib/auth/permissions.ts
- src/lib/constants/platform-roles.ts
- src/middleware.ts (mit auth guard)
- data/skills/soft-skills.json (45 Einträge)

Markiere fehlende Dateien.

---

## TEIL 6 — Security Checks (Code)

### 6a — use server Direktiven
```bash
for f in src/lib/services/*.ts src/app/actions/*.ts; do
  first=$(head -1 "$f" | tr -d "\"'")
  if [[ ! "$first" =~ "use server" ]]; then
    echo "⚠️  FEHLT: use server in $f"
  fi
done
```

### 6b — Anthropic Key nur server-seitig
```bash
grep -rn "ANTHROPIC_API_KEY\|anthropic" src/ --include="*.ts" --include="*.tsx"
grep -rn "NEXT_PUBLIC_ANTHROPIC" src/ && echo "❌ LEAK!" || echo "✅ kein public key"
```

### 6c — Rate Limiting prüfen
```bash
grep -n "rateLimit\|RateLimit\|checkRateLimit" src/app/api/career/mentor/route.ts
```

Erwartung: rate limiter logic vorhanden.

### 6d — CSP in next.config
```bash
grep -A 20 "Content-Security-Policy\|contentSecurityPolicy" next.config.ts
```

Prüfen:
- `api.anthropic.com` NICHT in connect-src
- `*.supabase.co` vorhanden

---

## TEIL 7 — Funktionaler Test lokal

```bash
# Dev-Server starten
npm run dev &
DEV_PID=$!
sleep 8

# Routen testen
for route in "/" "/auth/login" "/profile" "/admin/validations"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${route}")
  echo "localhost${route}: ${code}"
done

# Cleanup
kill $DEV_PID 2>/dev/null
```

Erwartet:
- / → 200 oder 307 (Redirect zu Login)
- /auth/login → 200
- /profile → 307 (Redirect wenn nicht eingeloggt) oder 200
- /admin/validations → 307 oder 404 (je nachdem ob Route existiert)

Falls eine Route 500 oder 503 liefert: Server-Logs in Terminal lesen und
den Fehler notieren.

---

## TEIL 8 — Vercel Deployment Check

Das ist der wichtigste Teil. Die Live-App hat HTTP 503 auf /profile.

### 8a — Env Vars auf Vercel prüfen

```bash
# Liste Vercel env vars (maskiert)
vercel env ls production 2>&1 | head -20
```

Erforderliche Keys auf Production:
- DATABASE_URL  (Pooler, Port 6543, mit pgbouncer=true)
- DIRECT_URL  (Direct, Port 5432)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY (ohne NEXT_PUBLIC_)

Prüfe besonders ob DATABASE_URL das NEUE Passwort hat (Wg3IHJYa6FqMGBgu).

### 8b — Letzte Vercel Builds prüfen

```bash
vercel ls --count 5
vercel logs --since 1h 2>&1 | head -100
```

Suche nach:
- Build-Errors
- PrismaClientInitializationError
- "Can't reach database server"
- "Authentication failed"

### 8c — Wenn 503 durch DB-Connection verursacht

Dann DATABASE_URL updaten:
```bash
# Altes entfernen
vercel env rm DATABASE_URL production --yes
# Neues setzen (Pooler-URL mit aktuellem Passwort)
echo "postgresql://postgres.laflrjhespxnmscilsbp:<NEUES_PASSWORT>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true" | vercel env add DATABASE_URL production

# DIRECT_URL auch prüfen
vercel env rm DIRECT_URL production --yes
echo "postgresql://postgres:<NEUES_PASSWORT>@db.laflrjhespxnmscilsbp.supabase.co:5432/postgres" | vercel env add DIRECT_URL production

# Redeploy triggern
vercel --prod
```

---

## TEIL 9 — Zusammenfassung

Erstelle einen Review-Report im Format:

```
## Code & Functional Review — <Datum>

### Git State
- Aktueller Commit: <hash> <message>
- Uncommitted: <ja/nein>
- Relevante Commits der letzten Sessions: <Liste>

### Schema
- ✅/❌ Alle erwarteten Modelle vorhanden
- Fehlend: <Liste>

### TypeScript
- ✅/❌ 0 Errors
- Neue Errors: <Liste>

### Datenbank (Production)
- Users: <count>
- CompetenceFields: <count> (davon <n> ohne Owner)
- Skills: <count>
- SoftSkills: <count>
- Roles: <count>
- Evidence/Timeline/History: <count>

### Features-Status
- ✅/❌ CSP ohne api.anthropic.com
- ✅/❌ Rate Limiting aktiv
- ✅/❌ Profile Page Server Component
- ✅/❌ DomainExpertSection mit Skill-Tree-Editor
- ✅/❌ AdminManagementSection mit Tabs
- ✅/❌ /admin/validations Route
- ✅/❌ use server in allen Services
- ✅/❌ Soft Skills 45/45 in DB

### Live App (convidera-career-universe.vercel.app)
- /profile: <HTTP Status> <Diagnose>
- Vercel Env Vars aktuell: <ja/nein>
- Build erfolgreich: <ja/nein>

### Kritische Findings
1. ...
2. ...

### Nächste Schritte
1. ...
2. ...
```

Wenn während des Reviews ein Fix nötig ist: ERST nachfragen ob gefixt
werden soll, nicht einfach committen.

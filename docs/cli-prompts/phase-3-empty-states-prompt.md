# Phase 3 — Empty States & Onboarding Polish

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Ziel: Alle Empty States systematisch auf Convidera-Design-Niveau bringen
> und den Onboarding-Flow für neue User auf einen einzigen klaren Pfad bringen.
>
> Dieser Prompt IST ausführbar. Er schreibt/editiert Code.

---

## KONTEXT — Status vor Phase 3

Laut Inventar-Audit (Phase-C-Meta-Prompt, 2026-04-22) gibt es **17 Empty States**
in der App, teils als plain `<p>` Tags, teils als halbherzige Boxen mit
inkonsistenten Paddings und Farben.

Onboarding existiert bereits in zwei parallelen Pfaden:

- `OnboardingWizard` unter `src/app/dashboard/components/OnboardingWizard.tsx`
  (aktiviert durch `user.isFirstLogin = !dbUser.currentRoleId`, gerendert via
  `/dashboard` Route).
- `userStateGuard` unter `src/lib/userStateGuard.ts` (leitet bei
  `state === 'onboarding'` von `/` nach `/my-career` um — konkurriert mit dem
  Wizard).

Phase 3 **vereinheitlicht** diese Pfade und füllt alle Empty States.

---

## TEIL 1 — EmptyState Primitive

### 1.1 Datei anlegen

Datei: `src/components/layout/EmptyState.tsx`

```tsx
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Button } from './Button'

interface Action {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction?: Action
  secondaryAction?: Action
  variant?: 'default' | 'inline'
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = 'default',
  children,
}: EmptyStateProps) {
  const isInline = variant === 'inline'

  return (
    <div
      className={
        isInline
          ? 'flex flex-col items-center text-center py-6'
          : 'flex flex-col items-center text-center py-16 md:py-20'
      }
    >
      <div
        className={
          isInline
            ? 'mb-3 h-10 w-10 rounded-lg bg-surface-soft flex items-center justify-center'
            : 'mb-6 h-16 w-16 rounded-lg bg-surface-soft flex items-center justify-center'
        }
      >
        <Icon
          className={isInline ? 'h-5 w-5 text-brand-blue' : 'h-8 w-8 text-brand-blue'}
          aria-hidden
        />
      </div>

      <h3
        className={
          isInline
            ? 'text-body font-medium text-text-primary'
            : 'text-h3 text-text-primary'
        }
      >
        {title}
      </h3>

      <p
        className={
          isInline
            ? 'mt-1 text-body-s text-text-secondary max-w-xs'
            : 'mt-2 text-body text-text-secondary max-w-sm'
        }
      >
        {description}
      </p>

      {children && <div className="mt-4 w-full max-w-sm">{children}</div>}

      {(primaryAction || secondaryAction) && (
        <div className={isInline ? 'mt-4 flex gap-2' : 'mt-6 flex flex-col sm:flex-row gap-2'}>
          {primaryAction && <ActionButton action={primaryAction} variant="primary" />}
          {secondaryAction && <ActionButton action={secondaryAction} variant="ghost" />}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  action,
  variant,
}: {
  action: Action
  variant: 'primary' | 'ghost'
}) {
  if (action.href) {
    return (
      <Link href={action.href}>
        <Button variant={variant}>{action.label}</Button>
      </Link>
    )
  }
  return (
    <Button variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  )
}
```

### 1.2 Export

In `src/components/layout/index.ts`:

```ts
export { EmptyState } from './EmptyState'
```

### 1.3 Verification

```bash
npx tsc --noEmit
```

---

## TEIL 2 — Empty States ersetzen (Priorität A)

### 2.a — Timeline (`/timeline`)

Datei: `src/components/evidence/EvidenceTimeline.tsx` (Zeile 56–64)

**Vorher** (plain text):
```tsx
if (months.length === 0) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-lg">Noch keine Einträge</p>
      <p className="text-sm mt-1">
        Reiche deine erste Evidence ein um die Timeline zu starten.
      </p>
    </div>
  )
}
```

**Nachher**:
```tsx
import { Clock } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
if (months.length === 0) {
  return (
    <EmptyState
      icon={Clock}
      title="Deine Karriere-Timeline beginnt hier"
      description="Reiche deine erste Evidence ein, um deinen Skill-Fortschritt zu dokumentieren. Jede Validierung wird hier als Meilenstein sichtbar."
      primaryAction={{ label: 'Zur Learning Journey', href: '/learning-journey' }}
      secondaryAction={{ label: 'Was ist Evidence?', href: '/profile#evidence-hilfe' }}
    />
  )
}
```

### 2.b — Dashboard Streak (`/`)

Datei: `src/components/dashboard/StreakGrid.tsx` (Zeile 30–42)

Der aktuelle "Starte heute deinen Streak"-Text bleibt in der Header-Zeile,
**aber**: füge unter der Wabengrid einen Hinweis an, wenn `totalActiveDays === 0`:

```tsx
{totalActiveDays === 0 && (
  <p className="mt-4 text-body-s text-text-secondary text-center">
    Die erste Reflexion oder Evidence zählt direkt.
  </p>
)}
```

Zusätzlich: erste Zelle von heute pulsierend hervorheben
(Tailwind: `animate-pulse` auf das aktuelle Grid-Cell wenn es noch leer ist).

### 2.c — Dashboard WeekStats (`/`)

Datei: `src/components/dashboard/WeekStatsCard.tsx` (Zeile 13–17)

**Vorher**:
```tsx
{total === 0 ? (
  <p className="text-body-s text-text-secondary">Noch keine Aktivität diese Woche.</p>
) : ( ... )}
```

**Nachher** (inline-Variante, passt in die Card):
```tsx
import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
{total === 0 ? (
  <EmptyState
    variant="inline"
    icon={Sparkles}
    title="Deine Woche wartet"
    description="Deine Wochenbilanz entsteht mit jedem Schritt."
  />
) : ( ... )}
```

### 2.d — Dashboard PathSnapshot (`/`)

Datei: `src/components/dashboard/PathSnapshotCard.tsx` (Zeile 78–82)

**Vorher**:
```tsx
) : (
  <p className="text-body-s text-text-secondary mb-4">
    Noch keine Zielrolle festgelegt.
  </p>
)}
```

**Nachher** (inline):
```tsx
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
) : (
  <EmptyState
    variant="inline"
    icon={Compass}
    title="Finde deinen nächsten Schritt"
    description="Setze eine Zielrolle um Skill-Gaps zu sehen und passende Lern-Impulse zu erhalten."
    primaryAction={{ label: 'Rollen erkunden', href: '/my-career' }}
  />
)}
```

Der darunterliegende Link "Explore Roles" kann dann entfallen (redundant).

### 2.e — /my-career Skills tab (`skillsByField.length === 0`)

Datei: `src/components/my-career/MyCareerView.tsx` (Zeile 389–392)

**Vorher**:
```tsx
{skillsByField.length === 0 ? (
  <p className="text-sm text-gray-400 mb-3">Noch keine Skills bewertet.</p>
) : ( ... )}
```

**Nachher**:
```tsx
import { Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
{skillsByField.length === 0 ? (
  <EmptyState
    variant="inline"
    icon={Sparkles}
    title="Noch keine Skills bewertet"
    description="Starte ein Self-Assessment in deinem Profil, um deine Skills zu erfassen."
    primaryAction={{ label: 'Zum Profil', href: '/profile' }}
  />
) : ( ... )}
```

### 2.f — /my-career Goals (`goals.length === 0`)

Datei: `src/components/my-career/MyCareerView.tsx` (Zeile 475–479)

```tsx
import { Target } from 'lucide-react'
// ...
{goals.length === 0 ? (
  <EmptyState
    variant="inline"
    icon={Target}
    title="Noch keine Ziele definiert"
    description="Setze eine Zielrolle und deine nächsten Karriere-Meilensteine erscheinen hier."
  />
) : ( ... )}
```

### 2.g — /my-career Activity (`recentActivity.length === 0`)

Datei: `src/components/my-career/MyCareerView.tsx` (Zeile 549–553)

```tsx
import { Activity } from 'lucide-react'
// ...
{recentActivity.length === 0 ? (
  <EmptyState
    variant="inline"
    icon={Activity}
    title="Noch keine Aktivitäten"
    description="Deine Karriere-Events werden hier in chronologischer Reihenfolge sichtbar."
  />
) : ( ... )}
```

---

## TEIL 3 — Empty States ersetzen (Priorität B)

### 3.a — Admin Validations (`/admin/validations`)

Datei: `src/components/evidence/ValidationPanel.tsx` (Zeile 50–57)

```tsx
import { ShieldCheck } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
if (pending.length === 0) {
  return (
    <EmptyState
      icon={ShieldCheck}
      title="Alles auf dem Stand"
      description="Keine ausstehenden Evidence-Einreichungen. Kollegen werden benachrichtigt, wenn neue Validierungsanfragen eintreffen."
      secondaryAction={{ label: 'Zum Profil', href: '/profile' }}
    />
  )
}
```

### 3.b — Learning Journey ohne Plan (`/learning-journey`)

Datei: `src/app/learning-journey/page.tsx` (Zeile 65–73)

```tsx
import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
if (!plan) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={userName} platformRole={platformRole} validationBadge={<ValidationBadge />} />
      <div className="max-w-2xl mx-auto px-4 pt-24">
        <EmptyState
          icon={BookOpen}
          title="Dein Lernweg beginnt hier"
          description="Wähle zuerst deine aktuelle und deine Zielrolle aus. Dann generieren wir deinen personalisierten Lernplan."
          primaryAction={{ label: 'Rollen auswählen', href: '/my-career' }}
        />
      </div>
    </div>
  )
}
```

### 3.c — FocusSelector leer (`focusedItems.length === 0`)

Datei: `src/components/learning-journey/FocusSelector.tsx` (Zeile 63–69)

Aktuell nur ein `<p>`. Upgrade auf inline EmptyState:

```tsx
import { Target } from 'lucide-react'
import { EmptyState } from '@/components/layout'
// ...
{focusedItems.length === 0 && (
  <EmptyState
    variant="inline"
    icon={Target}
    title="Noch kein Fokus gesetzt"
    description="Wähle bis zu 3 Skills aus der Timeline, um sie zu fokussieren."
  />
)}
```

### 3.d — Admin Dashboard Empty States

Datei: `src/app/admin/dashboard/AdminDashboardView.tsx`

Folgende Zeilen ersetzen mit inline-EmptyStates (alle gleicher Pattern):

| Zeile | Text aktuell | Neuer Title | Icon |
|---|---|---|---|
| 368 | "Noch keine Zielrollen definiert" | "Keine Zielrollen erfasst" | `Target` |
| 564 | "Noch keine Training-Aktivität" | "Noch keine Trainings-Aktivität" | `GraduationCap` |
| 830 | "Noch keine Karrierepfade definiert." | "Keine Karrierepfade angelegt" | `Map` |
| 1235 | "Noch kein Feedback vorhanden" | "Noch kein Feedback" | `MessageCircle` |

Für jeden: `variant="inline"`, description 1 Satz, keine CTA
(es sind Admin-Read-Only-Views).

---

## TEIL 4 — Empty States (Priorität C, optional)

### 4.a — DomainExpert ohne Kompetenzfelder

Datei: `src/app/profile/sections/DomainExpertSection.tsx` (Zeile 48–54)

```tsx
import { ShieldQuestion } from 'lucide-react'
// ...
{ownedFields.length === 0 && (
  <EmptyState
    icon={ShieldQuestion}
    title="Noch keine Kompetenzfelder zugewiesen"
    description="Bitte wende dich an einen Admin um Ownership für ein Feld zu erhalten."
  />
)}
```

### 4.b — CareerPathsPanel & RolesManagementPanel

Beide: `variant="inline"` mit passendem Icon (`Route` / `Users`).

---

## TEIL 5 — Onboarding-Pfad vereinheitlichen

### 5.1 Entscheidung

Es gibt zwei konkurrierende Pfade. Wir **behalten den OnboardingWizard**
(reicher 3-Step Flow bereits vorhanden) und entfernen die Duplikat-Umleitung
im Homepage.

### 5.2 Homepage (`src/app/page.tsx`) anpassen

Suche Block:

```ts
if (userState.state === 'onboarding') {
  redirect('/my-career')
}
```

Ersetze durch:

```ts
if (userState.state === 'onboarding') {
  redirect('/dashboard')  // OnboardingWizard übernimmt
}
```

### 5.3 Auth-Callback (`src/app/auth/callback/route.ts`)

Default-Target bereits `/dashboard` — passt. Keine Änderung nötig.

### 5.4 OnboardingWizard Empty-State-Polish

Datei: `src/app/dashboard/components/OnboardingWizard.tsx`

Falls Filter-Query keine Treffer liefert (Zeile ~27 filter):

```tsx
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/layout'

{filteredRoles.length === 0 && searchQuery && (
  <EmptyState
    variant="inline"
    icon={SearchX}
    title="Keine Rolle gefunden"
    description={`Für "${searchQuery}" haben wir keinen Treffer. Versuche einen anderen Begriff.`}
  />
)}
```

---

## TEIL 6 — Verification

```bash
# TypeScript
npx tsc --noEmit

# Build
npm run build

# Dev-Server + manueller Check
npm run dev
```

Manuelle Testpunkte (mit einem User der currentRoleId=null hat oder
frischer Registrierung):

1. Register → Magic Link → `/auth/callback` → `/dashboard` → OnboardingWizard erscheint
2. Wizard durchklicken → `/dashboard` → leerer Dashboard-State (StreakGrid/WeekStats/PathSnapshot zeigen EmptyState)
3. `/timeline` → EmptyState mit CTA "Zur Learning Journey"
4. `/learning-journey` → EmptyState "Dein Lernweg beginnt hier" wenn kein Plan
5. `/my-career` → alle drei Tabs zeigen passende inline-EmptyStates
6. FUNCTIONAL_LEAD/ADMIN: `/admin/validations` → "Alles auf dem Stand"

---

## TEIL 7 — Commit & Report

```bash
git add src/components/layout/EmptyState.tsx src/components/layout/index.ts \
        src/components/evidence/EvidenceTimeline.tsx \
        src/components/evidence/ValidationPanel.tsx \
        src/components/dashboard/StreakGrid.tsx \
        src/components/dashboard/WeekStatsCard.tsx \
        src/components/dashboard/PathSnapshotCard.tsx \
        src/components/my-career/MyCareerView.tsx \
        src/app/learning-journey/page.tsx \
        src/components/learning-journey/FocusSelector.tsx \
        src/app/admin/dashboard/AdminDashboardView.tsx \
        src/app/profile/sections/DomainExpertSection.tsx \
        src/app/page.tsx \
        src/app/dashboard/components/OnboardingWizard.tsx

git commit -m "feat: unified EmptyState primitive across 17 empty states"

git push origin main
```

### Abschlussreport

Berichte danach:

1. Welche Empty States wurden tatsächlich umgestellt (A/B/C)?
2. Ist der Onboarding-Flow jetzt eindeutig (ein Pfad)?
3. TypeScript 0 Errors?
4. Build erfolgreich?
5. Visueller Smoke-Check auf leerem User bestanden?

---

## ANHANG — Identifizierte Empty States (Inventar, 17 Stück)

| # | Datei:Zeile | Route | Priorität | Status nach Phase 3 |
|---|---|---|---|---|
| 1 | components/evidence/EvidenceTimeline.tsx:59 | /timeline | **A** | EmptyState full |
| 2 | components/evidence/ValidationPanel.tsx:53 | /admin/validations | B | EmptyState full |
| 3 | components/dashboard/WeekStatsCard.tsx:15 | / | **A** | EmptyState inline |
| 4 | components/dashboard/StreakGrid.tsx:37 | / | **A** | Polish (keine Umstellung) |
| 5 | components/dashboard/PathSnapshotCard.tsx:79 | / | **A** | EmptyState inline |
| 6 | app/learning-journey/page.tsx:67 | /learning-journey | B | EmptyState full |
| 7 | my-career/MyCareerView.tsx:391 | /my-career | **A** | EmptyState inline |
| 8 | my-career/MyCareerView.tsx:477 | /my-career | **A** | EmptyState inline |
| 9 | my-career/MyCareerView.tsx:551 | /my-career | **A** | EmptyState inline |
| 10 | profile/sections/DomainExpertSection.tsx:48 | /profile | C | EmptyState full |
| 11 | learning-journey/FocusSelector.tsx:65 | /learning-journey | B | EmptyState inline |
| 12 | admin/CareerPathsPanel.tsx:95 | /admin | C | (optional) |
| 13 | admin/dashboard/AdminDashboardView.tsx:368 | /admin/dashboard | B | EmptyState inline |
| 14 | admin/dashboard/AdminDashboardView.tsx:564 | /admin/dashboard | B | EmptyState inline |
| 15 | admin/dashboard/AdminDashboardView.tsx:830 | /admin/dashboard | B | EmptyState inline |
| 16 | admin/dashboard/AdminDashboardView.tsx:1235 | /admin/dashboard | B | EmptyState inline |
| 17 | admin/RolesManagementPanel.tsx:86 | /admin | C | (optional) |

Convidera-Design-Token:
- `bg-surface-soft` für Icon-Box-Hintergrund
- `text-brand-blue` für Icon
- `text-text-primary` / `text-text-secondary` für Typo
- `text-h3` / `text-body` / `text-body-s` aus Typo-System
- Button variants: `primary` | `ghost` | `secondary`

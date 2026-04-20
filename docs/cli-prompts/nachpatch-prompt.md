# Career Universe 2.0 — Nachpatch: Validations Route, Settings, archiveSkill

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Voraussetzung: git pull origin main

Lies zuerst:
- src/app/profile/ProfileClient.tsx
- src/app/profile/ProfileForm.tsx (Passwort-Logik prüfen)
- src/components/shared/Navigation.tsx
- prisma/schema.prisma (Skill-Modell)
- src/app/actions/skill-management.ts

Bestätige nach jeder Phase kurz was erstellt wurde.

---

## PHASE 1 — /admin/validations Route

Erstelle src/app/admin/validations/page.tsx als Server Component.
Die Logik für getPendingValidations() liegt bereits in
src/lib/services/evidence-timeline.ts.

```typescript
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getPendingValidations } from '@/lib/services/evidence-timeline'
import { ValidationPanelWrapper } from '@/components/evidence/ValidationPanelWrapper'

export default async function ValidationsPage() {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } })
  if (!dbUser || dbUser.platformRole === 'USER' || dbUser.platformRole === 'MEMBER') {
    redirect('/profile')
  }

  const pending = await getPendingValidations()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900">Offene Validierungen</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pending.length} Einreichung{pending.length !== 1 ? 'en' : ''} ausstehend
        </p>
      </div>
      <ValidationPanelWrapper initialPending={pending} />
    </div>
  )
}
```

Falls ValidationPanelWrapper noch nicht existiert, erstelle ihn:

```typescript
// src/components/evidence/ValidationPanelWrapper.tsx
'use client'
import { useRouter } from 'next/navigation'
import { ValidationPanel } from './ValidationPanel'

export function ValidationPanelWrapper({ initialPending }: { initialPending: any[] }) {
  const router = useRouter()
  return (
    <ValidationPanel
      pending={initialPending}
      onValidated={() => router.refresh()}
    />
  )
}
```

Falls ValidationPanel noch nicht existiert: Stub anlegen der pending.length
anzeigt, damit die Route nicht crasht. Wir bauen die Komponente im
Evidence-Timeline-Prompt vollständig aus.

---

## PHASE 2 — Validierungs-Badge in Navigation

Öffne src/components/shared/Navigation.tsx.

Prüfe ob die Nav serverseitig oder clientseitig gerendert wird.

Falls Server Component: Füge einen async ValidationBadge ein:

```typescript
// src/components/layout/ValidationBadge.tsx
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function ValidationBadge() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.platformRole !== 'FUNCTIONAL_LEAD' && dbUser.platformRole !== 'ADMIN')) {
      return null
    }

    const count = await prisma.evidence.count({
      where: {
        status: 'EVIDENCE_SUBMITTED',
        ...(dbUser.platformRole !== 'ADMIN' ? {
          skill: { competenceField: { ownerId: dbUser.id } }
        } : {})
      }
    })

    if (count === 0) return null

    return (
      <span className="ml-1.5 bg-[#0055FF] text-white text-xs font-medium
        px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
        {count}
      </span>
    )
  } catch {
    return null
  }
}
```

Importiere ValidationBadge in die Navigation und zeige ihn neben dem
Validierungen-Link. Wrap in Suspense damit er die Navigation nicht blockiert:

```typescript
import { Suspense } from 'react'
import { ValidationBadge } from '@/components/layout/ValidationBadge'

// In der Nav neben dem Link zu /admin/validations:
<Link href="/admin/validations">
  Validierungen
  <Suspense fallback={null}>
    <ValidationBadge />
  </Suspense>
</Link>
```

Den Link nur rendern wenn user.platformRole === 'FUNCTIONAL_LEAD' oder 'ADMIN'.
Prüfe wie die Navigation aktuell an den User-State kommt und passe es an.

Falls die Navigation ein Client Component ist: Badge-Count über eine
eigene API-Route laden:

```typescript
// src/app/api/validations/count/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || (dbUser.platformRole !== 'FUNCTIONAL_LEAD' && dbUser.platformRole !== 'ADMIN')) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.evidence.count({
      where: { status: 'EVIDENCE_SUBMITTED' }
    })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
```

---

## PHASE 3 — archiveSkill: Schema + Action

### 3a — Schema erweitern

Öffne prisma/schema.prisma und füge zum Skill-Modell hinzu:

```prisma
model Skill {
  // ... bestehende Felder ...
  isArchived  Boolean  @default(false)  // NEU
}
```

Dann:
```bash
npx prisma migrate dev --name add_skill_archived
npx prisma generate
```

Falls migrate dev wegen unbaselined history fehlschlägt:
```bash
npx prisma db push
```

### 3b — archiveSkill Action aktivieren

Öffne src/app/actions/skill-management.ts und ergänze archiveSkill:

```typescript
export async function archiveSkill(skillId: string) {
  const user = await requireUser()

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { competenceField: true }
  })
  if (!skill) throw new Error('Skill nicht gefunden')

  if (!isAdmin(user)) {
    if ((skill.competenceField as any).ownerId !== user.id) {
      throw new Error('Keine Berechtigung')
    }
  }

  await prisma.skill.update({
    where: { id: skillId },
    data: { isArchived: true }
  })

  revalidatePath('/profile')
}
```

### 3c — SkillTreeEditor archivieren ermöglichen

Öffne src/app/profile/sections/DomainExpertSection.tsx und füge im
SkillTreeEditor einen Archivieren-Button hinzu — erscheint beim Hover
auf einen Skill-Chip als kleines ✕ rechts neben dem Namen:

```typescript
import { archiveSkill } from '@/app/actions/skill-management'

// Im Chip, neben dem Edit-Button:
<div className="relative group/chip inline-flex">
  <button onClick={() => { setEditingId(skill.id); setEditName(skill.name) }}
    className="text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200
      text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700
      transition-colors pr-6">
    {skill.name}
  </button>
  <button
    onClick={async () => {
      if (!confirm(`"${skill.name}" archivieren?`)) return
      startTransition(async () => {
        await archiveSkill(skill.id)
      })
    }}
    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-300
      hover:text-red-500 opacity-0 group-hover/chip:opacity-100
      transition-opacity text-xs leading-none"
    title="Archivieren"
  >
    ✕
  </button>
</div>
```

Archivierte Skills aus der Anzeige filtern:

```typescript
// In SkillTreeEditor, beim Rendern der Skills:
const activeSkills = (field.skills ?? []).filter((s: any) => !s.isArchived)
```

---

## PHASE 4 — Passwort / Einstellungen in ProfileClient

Prüfe src/app/profile/ProfileForm.tsx — enthält es eine Passwort-Ändern-Funktion?

Falls ja: Prüfe ob Magic-Link-Login verwendet wird (in src/app/auth/login/page.tsx).

Falls Magic Link: Kein Passwort nötig. ProfileForm.tsx löschen:
```bash
rm src/app/profile/ProfileForm.tsx
```
Und alle Imports davon entfernen.

Falls Password-Login: Integriere die Passwort-Funktion als eigener Tab
im ProfileClient. Füge in der mode-toggle Sektion einen dritten Button hinzu:

```typescript
// Nur anzeigen wenn Password-Auth aktiv:
<button
  onClick={() => setMode('settings')}
  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l
    border-gray-200 ${mode === 'settings'
      ? 'bg-gray-100 text-gray-900'
      : 'text-gray-500 hover:text-gray-700'
    }`}
>
  Einstellungen
</button>
```

Settings-Section als einfache Komponente:

```typescript
// src/app/profile/sections/SettingsSection.tsx
'use client'
import { useState } from 'react'

export function SettingsSection({ userEmail }: { userEmail: string }) {
  const [sent, setSent] = useState(false)

  async function handlePasswordReset() {
    // Supabase Magic Link / Password Reset
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email: userEmail })
    })
    if (res.ok) setSent(true)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        Account-Einstellungen
      </p>
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <div>
          <p className="text-sm text-gray-900">E-Mail</p>
          <p className="text-xs text-gray-400 mt-0.5">{userEmail}</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm text-gray-900">Passwort zurücksetzen</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Link wird an deine E-Mail gesendet
          </p>
        </div>
        {sent ? (
          <span className="text-xs text-green-600">E-Mail gesendet</span>
        ) : (
          <button
            onClick={handlePasswordReset}
            className="text-xs text-[#0055FF] hover:underline"
          >
            Link senden
          </button>
        )}
      </div>
    </div>
  )
}
```

Falls Magic Link und ProfileForm.tsx gelöscht: SettingsSection weglassen,
da nichts einzustellen ist.

---

## PHASE 5 — TypeScript Check + Commit

```bash
npx tsc --noEmit
```

Fehler fixen. Dann:

```bash
git add -A
git commit -m "feat: admin validations route, validation badge, archiveSkill

- /admin/validations page with ValidationPanelWrapper
- ValidationBadge async Server Component in Navigation
- archiveSkill: isArchived field in schema + action + UI
- ProfileForm cleanup (Magic Link → no password needed)
- /api/validations/count route for client nav badge fallback"

git push origin main
```

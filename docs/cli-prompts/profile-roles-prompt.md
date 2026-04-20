# Career Universe 2.0 — Dual-Role Profile Pages & Skill Tree Management

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Stack: Next.js 14 App Router · TypeScript · Prisma · Supabase · Tailwind · Framer Motion
> Voraussetzung: Schema mit PlatformRole (ADMIN, FUNCTIONAL_LEAD/DOMAIN_EXPERT, USER/MEMBER)

Lies zuerst:
- prisma/schema.prisma (PlatformRole Enum, User, CompetenceField, Skill, Role)
- src/app/profile/ (falls vorhanden)
- src/middleware.ts (Auth-Handling)
- src/lib/constants/ (falls platform-roles.ts existiert)

Bestätige nach jeder Phase kurz was erstellt wurde.

---

## PHASE 1 — Zentrale Konstanten & Permission-Helpers

Erstelle src/lib/constants/platform-roles.ts:

```typescript
export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  FUNCTIONAL_LEAD: 'Domain Experte',
  DOMAIN_EXPERT: 'Domain Experte',
  USER: 'Mitarbeiter',
  MEMBER: 'Mitarbeiter',
}

export const PLATFORM_ROLE_BADGE: Record<string, {
  label: string
  bg: string
  text: string
}> = {
  ADMIN: {
    label: 'Admin',
    bg: 'bg-red-50',
    text: 'text-red-800'
  },
  FUNCTIONAL_LEAD: {
    label: 'Domain Experte',
    bg: 'bg-blue-50',
    text: 'text-blue-800'
  },
  DOMAIN_EXPERT: {
    label: 'Domain Experte',
    bg: 'bg-blue-50',
    text: 'text-blue-800'
  },
  USER: {
    label: 'Mitarbeiter',
    bg: 'bg-green-50',
    text: 'text-green-800'
  },
  MEMBER: {
    label: 'Mitarbeiter',
    bg: 'bg-green-50',
    text: 'text-green-800'
  },
}
```

Erstelle src/lib/auth/permissions.ts:

```typescript
import type { User } from '@prisma/client'

export function isAdmin(user: User) {
  return user.platformRole === 'ADMIN'
}

export function isDomainExpert(user: User) {
  return user.platformRole === 'FUNCTIONAL_LEAD'
    || user.platformRole === 'DOMAIN_EXPERT'
    || user.platformRole === 'ADMIN' // Admin kann alles was Domain Experte kann
}

export function canManageSkills(user: User, competenceFieldId: string) {
  if (isAdmin(user)) return true
  // Domain Experte nur für eigene Felder — wird in Server Action
  // gegen CompetenceField.ownerId geprüft
  return isDomainExpert(user)
}

export function canValidateEvidence(user: User) {
  return isDomainExpert(user)
}

export function canManageRoles(user: User) {
  return isAdmin(user)
}

export function canManageCareerPaths(user: User) {
  return isAdmin(user)
}

export function canManageTeam(user: User) {
  return isAdmin(user)
}
```

---

## PHASE 2 — Server Actions für Skill-Tree-Verwaltung

Erstelle src/app/actions/skill-management.ts:

```typescript
'use server'

import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth/require-user'
import { isAdmin } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'

// Skill zu einem Kompetenzfeld hinzufügen
export async function addSkill(input: {
  competenceFieldId: string
  name: string
  slug: string
  groupName?: string
}) {
  const user = await requireUser()

  // Admin: darf überall. Domain Experte: nur eigenes Feld
  if (!isAdmin(user)) {
    const field = await prisma.competenceField.findUnique({
      where: { id: input.competenceFieldId }
    })
    // Passe ownerId an tatsächliches Schema-Feld an
    if (!field || (field as any).ownerId !== user.id) {
      throw new Error('Keine Berechtigung für dieses Kompetenzfeld')
    }
  }

  // Prüfe ob Slug bereits existiert
  const existing = await prisma.skill.findUnique({
    where: { slug: input.slug }
  })
  if (existing) throw new Error(`Skill mit Slug "${input.slug}" existiert bereits`)

  const skill = await prisma.skill.create({
    data: {
      name: input.name,
      slug: input.slug,
      competenceFieldId: input.competenceFieldId,
      // group: input.groupName ?? null  // falls Schema group-Feld hat
    }
  })

  revalidatePath('/profile')
  revalidatePath('/admin/skills')
  return skill
}

// Skill umbenennen / Gruppe ändern
export async function updateSkill(input: {
  skillId: string
  name?: string
  groupName?: string
}) {
  const user = await requireUser()

  const skill = await prisma.skill.findUnique({
    where: { id: input.skillId },
    include: { competenceField: true }
  })
  if (!skill) throw new Error('Skill nicht gefunden')

  if (!isAdmin(user)) {
    if ((skill.competenceField as any).ownerId !== user.id) {
      throw new Error('Keine Berechtigung')
    }
  }

  const updated = await prisma.skill.update({
    where: { id: input.skillId },
    data: {
      ...(input.name && { name: input.name }),
      // ...(input.groupName !== undefined && { group: input.groupName })
    }
  })

  revalidatePath('/profile')
  return updated
}

// Skill archivieren (kein Löschen — bestehende Assessments bleiben)
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

  // Prüfe ob Schema isArchived/isActive Feld hat
  // Falls nicht: übernehme Archivierung via ActivityLog oder ignoriere vorerst
  // await prisma.skill.update({
  //   where: { id: skillId },
  //   data: { isArchived: true }
  // })

  revalidatePath('/profile')
}

// Neues Kompetenzfeld anlegen (nur Admin)
export async function createCompetenceField(input: {
  name: string
  slug: string
  ownerId?: string
}) {
  const user = await requireUser()
  if (!isAdmin(user)) throw new Error('Nur Admins können Kompetenzfelder anlegen')

  const field = await prisma.competenceField.create({
    data: {
      name: input.name,
      slug: input.slug,
      // ownerId: input.ownerId ?? null
    }
  })

  revalidatePath('/profile')
  revalidatePath('/admin/skills')
  return field
}

// Domain Experten-Zuweisung (nur Admin)
export async function assignDomainExpert(input: {
  competenceFieldId: string
  userId: string
}) {
  const user = await requireUser()
  if (!isAdmin(user)) throw new Error('Nur Admins können Domain Experten zuweisen')

  // User auf FUNCTIONAL_LEAD upgraden wenn noch nicht
  await prisma.user.update({
    where: { id: input.userId },
    data: { platformRole: 'FUNCTIONAL_LEAD' }
  })

  // CompetenceField.ownerId setzen (Feldname aus Schema prüfen)
  // await prisma.competenceField.update({
  //   where: { id: input.competenceFieldId },
  //   data: { ownerId: input.userId }
  // })

  revalidatePath('/profile')
  revalidatePath('/admin')
}

// Skill vorschlagen (Domain Experte → Admin zur Prüfung)
export async function proposeSkill(input: {
  competenceFieldId: string
  name: string
  rationale: string
}) {
  const user = await requireUser()

  // Als ActivityLog-Eintrag speichern bis Admin genehmigt
  // Oder eigenes SkillProposal Model (falls im Schema)
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      // type: 'SKILL_PROPOSAL',
      // payload: JSON.stringify(input)
      // Passe an tatsächliche ActivityLog-Felder an
    } as any
  })

  revalidatePath('/profile')
}
```

---

## PHASE 3 — Profile Page (Server Component, rollenbasiert)

Erstelle src/app/profile/page.tsx:

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { isAdmin, isDomainExpert } from '@/lib/auth/permissions'
import { ProfileClient } from './ProfileClient'

export default async function ProfilePage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/auth/login')

  // Passe supabaseId/authId an tatsächliches Schema-Feld an
  const user = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: {
      // Eigene Rolle
      currentRole: true,
      // Zielrolle (aus CareerGoal)
      careerGoals: {
        where: { status: 'ACTIVE' },
        include: { targetRole: true },
        take: 1
      },
      // Skill-Assessments Zusammenfassung
      skillAssessments: {
        select: {
          id: true,
          status: true,  // AssessmentStatus enum — passe an
          selfLevel: true,
          validatedLevel: true
        }
      },
      // Eigene Kompetenzfelder (Domain Experte)
      ownedFields: {
        include: {
          skills: true,
          // Mitarbeiter in diesem Feld
        }
      }
    }
  })

  if (!user) redirect('/auth/login')

  // Offene Validierungen für Domain Experte / Admin
  const pendingValidations = isDomainExpert(user)
    ? await prisma.evidence.findMany({
        where: {
          status: 'EVIDENCE_SUBMITTED',
          ...(isAdmin(user) ? {} : {
            skill: {
              competenceField: {
                ownerId: user.id  // nur eigene Felder
              }
            }
          })
        },
        include: {
          user: { select: { name: true, email: true } },
          skill: { include: { competenceField: true } }
        },
        orderBy: { createdAt: 'asc' }
      })
    : []

  // Alle Kompetenzfelder für Admin-Skill-Tree
  const allCompetenceFields = isAdmin(user)
    ? await prisma.competenceField.findMany({
        include: {
          skills: { orderBy: { name: 'asc' } },
          // owner: { select: { name: true } }
        },
        orderBy: { name: 'asc' }
      })
    : []

  // Alle User für Admin-Team-Verwaltung
  const allUsers = isAdmin(user)
    ? await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          platformRole: true,
          currentRole: { select: { title: true, level: true } }
        },
        orderBy: { name: 'asc' }
      })
    : []

  // Stats berechnen
  const assessmentStats = {
    validated: user.skillAssessments.filter(
      a => (a as any).status === 'VALIDATED' || a.validatedLevel != null
    ).length,
    pending: user.skillAssessments.filter(
      a => (a as any).status === 'EVIDENCE_SUBMITTED'
    ).length,
    selfAssessed: user.skillAssessments.filter(
      a => (a as any).status === 'SELF_ASSESSED'
    ).length,
  }

  return (
    <ProfileClient
      user={user as any}
      pendingValidations={pendingValidations as any}
      allCompetenceFields={allCompetenceFields as any}
      allUsers={allUsers as any}
      assessmentStats={assessmentStats}
      isAdmin={isAdmin(user)}
      isDomainExpert={isDomainExpert(user)}
    />
  )
}
```

---

## PHASE 4 — ProfileClient (Client Component mit Mode-Toggle)

Erstelle src/app/profile/ProfileClient.tsx:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLATFORM_ROLE_BADGE } from '@/lib/constants/platform-roles'
import { PersonalDevelopmentSection } from './sections/PersonalDevelopmentSection'
import { AdminManagementSection } from './sections/AdminManagementSection'
import { DomainExpertSection } from './sections/DomainExpertSection'

type ProfileMode = 'personal' | 'management'

interface ProfileClientProps {
  user: any
  pendingValidations: any[]
  allCompetenceFields: any[]
  allUsers: any[]
  assessmentStats: { validated: number; pending: number; selfAssessed: number }
  isAdmin: boolean
  isDomainExpert: boolean
}

export function ProfileClient({
  user,
  pendingValidations,
  allCompetenceFields,
  allUsers,
  assessmentStats,
  isAdmin,
  isDomainExpert,
}: ProfileClientProps) {
  const [mode, setMode] = useState<ProfileMode>('personal')
  const badge = PLATFORM_ROLE_BADGE[user.platformRole] ?? PLATFORM_ROLE_BADGE.MEMBER
  const showToggle = isAdmin || isDomainExpert
  const initials = (user.name ?? user.email)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
        <div className="p-5 flex items-center gap-4 border-b border-gray-100">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center
            font-medium text-sm flex-shrink-0
            ${isAdmin ? 'bg-red-50 text-red-800' :
              isDomainExpert ? 'bg-blue-50 text-blue-800' :
              'bg-green-50 text-green-800'}`}>
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {user.name ?? user.email}
            </p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5
              rounded-full mt-1 ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
          </div>

          {/* Mode Toggle */}
          {showToggle && (
            <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setMode('personal')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === 'personal'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Meine Entwicklung
              </button>
              <button
                onClick={() => setMode('management')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${
                  mode === 'management'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {isAdmin ? 'Plattform-Verwaltung' : 'Mein Kompetenzfeld'}
              </button>
            </div>
          )}
        </div>

        {/* Zone-Indicator */}
        {showToggle && (
          <div className={`px-5 py-2 flex items-center gap-2 text-xs font-medium
            ${mode === 'personal'
              ? 'bg-green-50 text-green-700'
              : isAdmin
                ? 'bg-red-50 text-red-700'
                : 'bg-blue-50 text-blue-700'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              mode === 'personal' ? 'bg-green-500' :
              isAdmin ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            {mode === 'personal'
              ? 'Persönliche Karriereentwicklung'
              : isAdmin ? 'Plattform-Verwaltung' : 'Kompetenzfeld-Verwaltung'
            }
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mode === 'personal' ? (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <PersonalDevelopmentSection
              user={user}
              assessmentStats={assessmentStats}
            />
          </motion.div>
        ) : (
          <motion.div
            key="management"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {isAdmin ? (
              <AdminManagementSection
                allCompetenceFields={allCompetenceFields}
                allUsers={allUsers}
                pendingValidations={pendingValidations}
              />
            ) : (
              <DomainExpertSection
                ownedFields={user.ownedFields}
                pendingValidations={pendingValidations}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## PHASE 5 — PersonalDevelopmentSection

Erstelle src/app/profile/sections/PersonalDevelopmentSection.tsx:

```typescript
'use client'

import Link from 'next/link'

export function PersonalDevelopmentSection({ user, assessmentStats }: {
  user: any
  assessmentStats: { validated: number; pending: number; selfAssessed: number }
}) {
  const activeGoal = user.careerGoals?.[0]
  const currentRole = user.currentRole
  const gapCount = 0 // TODO: aus compareRoles() berechnen wenn Zielrolle gesetzt

  return (
    <div className="space-y-3">
      {/* Rollen-Karte */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Meine Rolle
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Aktuell</span>
            <span className="font-medium text-gray-900">
              {currentRole
                ? `${currentRole.title} ${currentRole.level}`
                : <span className="text-gray-400">nicht gesetzt</span>
              }
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Zielrolle</span>
            <span className="font-medium text-gray-900">
              {activeGoal?.targetRole
                ? `${activeGoal.targetRole.title} ${activeGoal.targetRole.level}`
                : <span className="text-gray-400">nicht gesetzt</span>
              }
            </span>
          </div>
          {activeGoal && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Offene Gaps</span>
              <span className={`font-medium ${gapCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {gapCount} Skills
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Skill-Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Skill-Status
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium text-green-600">
              {assessmentStats.validated}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Validiert</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium text-amber-500">
              {assessmentStats.pending}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Ausstehend</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium text-gray-500">
              {assessmentStats.selfAssessed}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Selbst eingeschätzt</div>
          </div>
        </div>
      </div>

      {/* Schnellzugriff */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Schnellzugriff
        </p>
        <div className="space-y-2">
          {[
            { href: '/timeline', label: 'Karriere-Timeline', desc: 'Dokumentierter Fortschritt & Evidenzen' },
            { href: '/my-career', label: 'Gap-Analyse', desc: 'Was fehlt für die Zielrolle?' },
            { href: '/journey', label: 'AI Mentor', desc: 'Persönliche Karriereberatung' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-3 border border-gray-200
                rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div>
                <div className="text-sm text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
              <span className="text-gray-400 group-hover:text-gray-600">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## PHASE 6 — DomainExpertSection mit Skill-Tree-Editor

Erstelle src/app/profile/sections/DomainExpertSection.tsx:

```typescript
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addSkill, updateSkill } from '@/app/actions/skill-management'

export function DomainExpertSection({ ownedFields, pendingValidations }: {
  ownedFields: any[]
  pendingValidations: any[]
}) {
  return (
    <div className="space-y-3">
      {/* Offene Validierungen */}
      {pendingValidations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Offene Validierungen
            </p>
            <span className="text-xs bg-amber-50 text-amber-700 font-medium
              px-2 py-0.5 rounded-full">
              {pendingValidations.length}
            </span>
          </div>
          <div className="space-y-2 mb-3">
            {pendingValidations.slice(0, 3).map(ev => (
              <div key={ev.id} className="flex justify-between items-center
                text-sm py-1.5 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-gray-900">
                    {ev.user?.name ?? ev.user?.email}
                  </span>
                  <span className="text-gray-400 mx-1.5">·</span>
                  <span className="text-gray-500 text-xs">
                    {ev.skill?.name} · L{ev.selfLevel}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/admin/validations"
            className="flex items-center justify-between p-3 border border-gray-200
              rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span>Alle Validierungen öffnen</span>
            <span className="text-gray-400">›</span>
          </Link>
        </div>
      )}

      {/* Skill-Trees */}
      {ownedFields.map(field => (
        <SkillTreeEditor key={field.id} field={field} />
      ))}

      {ownedFields.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">
            Dir sind noch keine Kompetenzfelder zugewiesen.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Bitte wende dich an einen Admin.
          </p>
        </div>
      )}
    </div>
  )
}

function SkillTreeEditor({ field }: { field: any }) {
  const [adding, setAdding] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAddSkill() {
    if (!newSkillName.trim()) return
    const slug = newSkillName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')

    startTransition(async () => {
      try {
        await addSkill({
          competenceFieldId: field.id,
          name: newSkillName.trim(),
          slug: `${field.slug}-${slug}`
        })
        setNewSkillName('')
        setAdding(false)
      } catch (e: any) {
        alert(e.message)
      }
    })
  }

  function handleUpdateSkill(skillId: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      try {
        await updateSkill({ skillId, name: editName.trim() })
        setEditingId(null)
        setEditName('')
      } catch (e: any) {
        alert(e.message)
      }
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {field.name}
        </p>
        <span className="text-xs text-gray-400">
          {field.skills?.length ?? 0} Skills
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {(field.skills ?? []).map((skill: any) => (
          <div key={skill.id}>
            {editingId === skill.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleUpdateSkill(skill.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  className="text-xs border border-blue-300 rounded px-2 py-1
                    focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
                  autoFocus
                />
                <button
                  onClick={() => handleUpdateSkill(skill.id)}
                  disabled={isPending}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingId(skill.id)
                  setEditName(skill.name)
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-gray-50
                  border border-gray-200 text-gray-700 hover:border-blue-300
                  hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {skill.name}
              </button>
            )}
          </div>
        ))}

        {/* Add-Skill Button / Input */}
        {adding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="Skill-Name"
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSkill()
                if (e.key === 'Escape') { setAdding(false); setNewSkillName('') }
              }}
              className="text-xs border border-blue-300 rounded px-2 py-1
                focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
              autoFocus
            />
            <button
              onClick={handleAddSkill}
              disabled={isPending || !newSkillName.trim()}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
            >
              ✓
            </button>
            <button
              onClick={() => { setAdding(false); setNewSkillName('') }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="text-xs px-2.5 py-1 rounded-md border border-dashed
              border-gray-300 text-gray-400 hover:border-gray-400
              hover:text-gray-600 transition-colors"
          >
            + Skill hinzufügen
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Klicke auf einen Skill um ihn umzubenennen
      </p>
    </div>
  )
}
```

---

## PHASE 7 — AdminManagementSection

Erstelle src/app/profile/sections/AdminManagementSection.tsx:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SkillTreeEditor } from './SkillTreeEditor'  // aus DomainExpertSection extrahieren

export function AdminManagementSection({ allCompetenceFields, allUsers, pendingValidations }: {
  allCompetenceFields: any[]
  allUsers: any[]
  pendingValidations: any[]
}) {
  const [activeTab, setActiveTab] = useState<'skills' | 'roles' | 'team'>('skills')

  const adminStats = {
    total: allUsers.length,
    fields: allCompetenceFields.length,
    skills: allCompetenceFields.reduce((sum, f) => sum + (f.skills?.length ?? 0), 0),
    pendingValidations: pendingValidations.length,
    fieldsWithoutExpert: allCompetenceFields.filter(f => !f.ownerId).length,
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Plattform-Übersicht
        </p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium">{adminStats.total}</div>
            <div className="text-xs text-gray-500 mt-0.5">Mitarbeiter</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium">{adminStats.fields}</div>
            <div className="text-xs text-gray-500 mt-0.5">Kompetenzfelder</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium">{adminStats.skills}</div>
            <div className="text-xs text-gray-500 mt-0.5">Skills</div>
          </div>
        </div>
        {adminStats.fieldsWithoutExpert > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3
            text-xs text-amber-700 mt-2">
            {adminStats.fieldsWithoutExpert} Kompetenzfeld{adminStats.fieldsWithoutExpert > 1 ? 'er' : ''}
            {' '}ohne Domain Experten — Validierungen blockiert.
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['skills', 'Skill-Trees'], ['roles', 'Rollen & Pfade'], ['team', 'Team']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-3">
          {allCompetenceFields.map(field => (
            <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{field.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {field.owner?.name
                      ? `Domain Experte: ${field.owner.name}`
                      : <span className="text-amber-600">Kein Domain Experte</span>
                    }
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {field.skills?.length ?? 0} Skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(field.skills ?? []).map((skill: any) => (
                  <span key={skill.id}
                    className="text-xs px-2.5 py-1 rounded-md bg-gray-50
                      border border-gray-200 text-gray-600">
                    {skill.name}
                  </span>
                ))}
                <Link
                  href={`/admin/skills?field=${field.id}`}
                  className="text-xs px-2.5 py-1 rounded-md border border-dashed
                    border-gray-300 text-gray-400 hover:border-[#0055FF]
                    hover:text-[#0055FF] transition-colors"
                >
                  Bearbeiten →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="space-y-2">
            {[
              { href: '/admin/roles', label: 'Rollenprofile', desc: 'Level-Anforderungen verwalten' },
              { href: '/admin/career-paths', label: 'Karrierepfade', desc: 'Übergänge zwischen Rollen' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center justify-between p-3 border border-gray-200
                  rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
                <span className="text-gray-400">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="space-y-2 mb-3">
            {allUsers.slice(0, 8).map(u => (
              <div key={u.id}
                className="flex items-center justify-between py-2
                  border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{u.name ?? u.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {u.currentRole
                      ? `${u.currentRole.title} ${u.currentRole.level}`
                      : 'Keine Rolle zugewiesen'
                    }
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  u.platformRole === 'ADMIN' ? 'bg-red-50 text-red-700' :
                  u.platformRole === 'FUNCTIONAL_LEAD' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {u.platformRole === 'ADMIN' ? 'Admin' :
                   u.platformRole === 'FUNCTIONAL_LEAD' ? 'Domain Experte' :
                   'Mitarbeiter'}
                </span>
              </div>
            ))}
          </div>
          <Link href="/admin/team"
            className="flex items-center justify-between p-3 border border-gray-200
              rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <span>Alle {allUsers.length} Mitarbeiter verwalten</span>
            <span className="text-gray-400">›</span>
          </Link>
        </div>
      )}
    </div>
  )
}
```

---

## PHASE 8 — Navigation anpassen

Öffne src/components/shared/Navigation.tsx und füge den Profil-Link hinzu.
Der Link zu /profile soll für alle User sichtbar sein.

Für FUNCTIONAL_LEAD und ADMIN: zeige zusätzlich den Validierungs-Badge:

```typescript
import { Suspense } from 'react'

// In der Navigation, nur für isDomainExpert/isAdmin:
<Link href="/admin/validations" className="relative flex items-center gap-1.5">
  Validierungen
  <Suspense fallback={null}>
    <ValidationBadge />  {/* async Server Component — gibt Anzahl zurück */}
  </Suspense>
</Link>
```

Falls ValidationBadge noch nicht existiert (aus evidence-timeline-prompt):
Erstelle src/components/layout/ValidationBadge.tsx als async Server Component
die pendingValidations zählt und einen blauen Badge zurückgibt.

---

## PHASE 9 — TypeScript Check & Feldname-Abgleich

Führe aus:
```bash
npx tsc --noEmit
```

Häufige Fehler die auftreten werden:
- `supabaseId` vs `authId` — passe an tatsächliches Schema-Feld an
- `platformRole` Enum-Werte — prüfe ob USER, MEMBER oder beides existiert
- `CompetenceField.ownerId` — prüfe ob Feld im Schema vorhanden ist,
  falls nicht: alle ownerId-Checks entfernen und TODO-Kommentar hinterlassen
- `AssessmentStatus` Enum-Werte — EVIDENCE_SUBMITTED, VALIDATED etc.

Fixe alle Fehler. Das Schema ist die Quelle der Wahrheit.

Dann:
```bash
git add -A
git commit -m "feat: dual-role profile pages with skill tree editor

- ProfileClient with mode toggle (Meine Entwicklung / Verwaltung)
- PersonalDevelopmentSection: career stats, quick links
- DomainExpertSection: inline skill-chip editor, pending validations
- AdminManagementSection: platform stats, skills/roles/team tabs
- skill-management.ts: addSkill, updateSkill, archiveSkill, createCompetenceField
- permissions.ts: isAdmin, isDomainExpert, canManageSkills helpers
- platform-roles.ts: PLATFORM_ROLE_LABELS, PLATFORM_ROLE_BADGE constants"

git push origin main
```

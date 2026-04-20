# Career Universe 2.0 — Evidence-Timeline Implementation

> Projekt: /Users/michaelbuck/optropic-workspace/ConvideraCareerUniverse
> Stack: Next.js 14 App Router · TypeScript · Prisma · Supabase · Tailwind · Framer Motion
> Voraussetzung: Der erste Code-Review CLI-Prompt wurde bereits ausgeführt.
> Die Modelle Evidence, ValidationEvent, TimelineEvent und AssessmentHistory
> sowie der AssessmentStatus-Enum sind im Schema vorhanden und migriert.

Lies zuerst diese Dateien um den aktuellen Stand zu verstehen:
- prisma/schema.prisma
- src/lib/services/evidence-timeline.ts
- src/lib/services/mentor-chat.ts
- src/lib/services/career-logic.ts
- src/lib/services/index.ts

Dann implementiere die folgenden Phasen in Reihenfolge. Bestätige nach jeder Phase
kurz was erstellt wurde, bevor du zur nächsten gehst.

---

## PHASE 1 — evidence-timeline.ts vervollständigen

Die Datei src/lib/services/evidence-timeline.ts existiert bereits. Prüfe ihren
aktuellen Inhalt und vervollständige sie mit diesen Funktionen, sofern sie noch
fehlen. Füge 'use server' als erste Zeile hinzu.

```typescript
// src/lib/services/evidence-timeline.ts
'use server'

import { prisma } from '@/lib/prisma'
import { AssessmentStatus } from '@prisma/client'
import { requireUser } from '@/lib/auth/require-user'

// Alle Evidence-Einträge eines Users, nach Monat gruppiert
export async function getTimeline(userId: string) {
  const user = await requireUser()
  // Nur eigene Timeline oder Admin/Lead darf fremde sehen
  if (user.id !== userId && user.platformRole === 'USER') {
    throw new Error('Unauthorized')
  }

  const events = await prisma.timelineEvent.findMany({
    where: { userId },
    include: {
      evidence: {
        include: { skill: { include: { competenceField: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Nach Jahr+Monat gruppieren
  const grouped = events.reduce((acc, event) => {
    const key = event.createdAt.toISOString().slice(0, 7) // "2026-04"
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {} as Record<string, typeof events>)

  return grouped
}

// Evidence für einen Skill einreichen
export async function submitEvidence(input: {
  skillId: string
  title: string
  description: string
  evidenceUrl?: string
  selfLevel: number
}) {
  const user = await requireUser()

  const evidence = await prisma.$transaction(async (tx) => {
    const ev = await tx.evidence.create({
      data: {
        userId: user.id,
        skillId: input.skillId,
        title: input.title,
        description: input.description,
        evidenceUrl: input.evidenceUrl,
        selfLevel: input.selfLevel,
        status: AssessmentStatus.EVIDENCE_SUBMITTED
      }
    })

    // TimelineEvent schreiben
    await tx.timelineEvent.create({
      data: {
        userId: user.id,
        evidenceId: ev.id,
        eventType: 'EVIDENCE_SUBMITTED',
        title: `Evidence eingereicht: ${input.title}`,
        metadata: { skillId: input.skillId, level: input.selfLevel }
      }
    })

    // SkillAssessment updaten
    await tx.skillAssessment.upsert({
      where: { userId_skillId: { userId: user.id, skillId: input.skillId } },
      update: {
        selfLevel: input.selfLevel,
        status: AssessmentStatus.EVIDENCE_SUBMITTED
      },
      create: {
        userId: user.id,
        skillId: input.skillId,
        selfLevel: input.selfLevel,
        status: AssessmentStatus.EVIDENCE_SUBMITTED
      }
    })

    // AssessmentHistory Eintrag
    await tx.assessmentHistory.create({
      data: {
        userId: user.id,
        skillId: input.skillId,
        level: input.selfLevel,
        type: 'SELF',
        assessedById: user.id
      }
    })

    return ev
  })

  return evidence
}

// Skill durch Functional Lead validieren
export async function validateEvidence(input: {
  evidenceId: string
  validatedLevel: number
  comment?: string
}) {
  const validator = await requireUser()

  if (validator.platformRole === 'USER') {
    throw new Error('Nur Functional Leads und Admins können validieren')
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id: input.evidenceId },
    include: { skill: true }
  })
  if (!evidence) throw new Error('Evidence nicht gefunden')
  if (evidence.userId === validator.id) throw new Error('Keine Selbst-Validierung')

  await prisma.$transaction(async (tx) => {
    await tx.evidence.update({
      where: { id: input.evidenceId },
      data: {
        status: AssessmentStatus.VALIDATED,
        validatedLevel: input.validatedLevel,
        validatedById: validator.id,
        validatedAt: new Date()
      }
    })

    await tx.validationEvent.create({
      data: {
        evidenceId: input.evidenceId,
        validatorId: validator.id,
        fromStatus: evidence.status,
        toStatus: AssessmentStatus.VALIDATED,
        comment: input.comment
      }
    })

    await tx.skillAssessment.update({
      where: { userId_skillId: { userId: evidence.userId, skillId: evidence.skillId } },
      data: {
        validatedLevel: input.validatedLevel,
        status: AssessmentStatus.VALIDATED,
        validatedById: validator.id,
        validatedAt: new Date()
      }
    })

    await tx.assessmentHistory.create({
      data: {
        userId: evidence.userId,
        skillId: evidence.skillId,
        level: input.validatedLevel,
        type: 'VALIDATED',
        assessedById: validator.id
      }
    })

    await tx.timelineEvent.create({
      data: {
        userId: evidence.userId,
        evidenceId: input.evidenceId,
        eventType: 'SKILL_VALIDATED',
        title: `${evidence.skill.name} auf Level ${input.validatedLevel} validiert`,
        metadata: {
          validatorId: validator.id,
          level: input.validatedLevel,
          comment: input.comment
        }
      }
    })
  })
}

// Alle offenen Evidence-Einreichungen für einen Functional Lead
export async function getPendingValidations() {
  const user = await requireUser()
  if (user.platformRole === 'USER') throw new Error('Unauthorized')

  return prisma.evidence.findMany({
    where: { status: AssessmentStatus.EVIDENCE_SUBMITTED },
    include: {
      user: { select: { id: true, email: true, name: true } },
      skill: { include: { competenceField: true } },
      validationEvents: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'asc' }
  })
}

// Tooltip-Daten für einen Skill (Hover-Kontext, lazy loaded)
export async function getSkillTooltipData(skillId: string, userId: string) {
  const [assessment, history, latestEvidence] = await Promise.all([
    prisma.skillAssessment.findUnique({
      where: { userId_skillId: { userId, skillId } }
    }),
    prisma.assessmentHistory.findMany({
      where: { userId, skillId },
      orderBy: { createdAt: 'asc' },
      take: 10
    }),
    prisma.evidence.findFirst({
      where: { userId, skillId },
      orderBy: { createdAt: 'desc' }
    })
  ])

  return { assessment, history, latestEvidence }
}

// Export-Daten für PDF (alle validierten Skills)
export async function getTimelineExportData(userId: string) {
  const user = await requireUser()
  if (user.id !== userId && user.platformRole === 'USER') {
    throw new Error('Unauthorized')
  }

  return prisma.evidence.findMany({
    where: { userId, status: AssessmentStatus.VALIDATED },
    include: {
      skill: { include: { competenceField: true } },
      validatedBy: { select: { name: true, email: true } },
      validationEvents: true
    },
    orderBy: { validatedAt: 'desc' }
  })
}
```

Prüfe ob requireUser() in src/lib/auth/require-user.ts existiert. Falls nicht,
erstelle die Datei:

```typescript
// src/lib/auth/require-user.ts
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function requireUser() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) throw new Error('User not provisioned')

  return dbUser
}
```

Passe den Supabase-Client-Import und das userId-Feld-Mapping an das tatsächliche
Schema an (supabaseId oder authId je nach Schema).

---

## PHASE 2 — SkillProgressBar Komponente

```typescript
// src/components/evidence/SkillProgressBar.tsx
'use client'

import { motion } from 'framer-motion'
import { AssessmentStatus } from '@prisma/client'

interface SkillProgressBarProps {
  skillName: string
  selfLevel: number
  validatedLevel?: number | null
  requiredLevel: number
  status: AssessmentStatus
  maxLevel?: number
  onEvidenceClick?: () => void
}

const STATUS_CONFIG = {
  SELF_ASSESSED: {
    label: 'Selbst eingeschätzt',
    barClass: 'bg-gray-300',
    showHatch: false
  },
  EVIDENCE_SUBMITTED: {
    label: 'Prüfung ausstehend',
    barClass: 'bg-amber-400',
    showHatch: true
  },
  VALIDATED: {
    label: 'Validiert',
    barClass: 'bg-[#0055FF]',
    showHatch: false
  }
}

export function SkillProgressBar({
  skillName,
  selfLevel,
  validatedLevel,
  requiredLevel,
  status,
  maxLevel = 4,
  onEvidenceClick
}: SkillProgressBarProps) {
  const config = STATUS_CONFIG[status]
  const displayLevel = status === 'VALIDATED' && validatedLevel != null
    ? validatedLevel
    : selfLevel
  const percentage = (displayLevel / maxLevel) * 100
  const isGap = displayLevel < requiredLevel

  return (
    <div className="group relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-800">{skillName}</span>
        <div className="flex items-center gap-2">
          {isGap && (
            <span className="text-xs text-red-500">
              Δ {requiredLevel - displayLevel}
            </span>
          )}
          <span className="text-xs text-gray-500">{config.label}</span>
        </div>
      </div>

      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Required level marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
          style={{ left: `${(requiredLevel / maxLevel) * 100}%` }}
        />

        {/* Progress bar */}
        <motion.div
          className={`h-full rounded-full ${config.barClass} ${
            config.showHatch ? 'bg-stripes' : ''
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>

      {/* Evidence CTA — nur wenn self-assessed und Gap vorhanden */}
      {status === 'SELF_ASSESSED' && isGap && onEvidenceClick && (
        <button
          onClick={onEvidenceClick}
          className="mt-1 text-xs text-[#0055FF] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          + Evidence einreichen
        </button>
      )}
    </div>
  )
}
```

Füge den Schraffur-Stil in globals.css hinzu:
```css
.bg-stripes {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255,255,255,0.4) 3px,
    rgba(255,255,255,0.4) 6px
  );
}
```

---

## PHASE 3 — EvidenceDialog Komponente

```typescript
// src/components/evidence/EvidenceDialog.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitEvidence } from '@/lib/services/evidence-timeline'

interface EvidenceDialogProps {
  skillId: string
  skillName: string
  currentLevel: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const LEVEL_LABELS = ['', 'Learner', 'Practitioner', 'Advanced', 'Master']

const EVIDENCE_SUGGESTIONS: Record<number, string[]> = {
  1: [
    'Screenshot einer abgeschlossenen Online-Schulung',
    'Zertifikat oder Teilnahmebestätigung',
    'Link zu einem Fachartikel mit eigenem Kommentar'
  ],
  2: [
    'Link zu einem Projekt-Deliverable',
    'Peer-Feedback Screenshot',
    'Präsentation oder Dokumentation die du erstellt hast'
  ],
  3: [
    'Projektleiter-Bestätigung per E-Mail',
    'Code-Review Feedback oder PR-Link',
    'Kundenfeedback oder Stakeholder-Mail'
  ],
  4: [
    'Intern gehaltene Schulung oder Workshop',
    'Veröffentlichter Artikel oder Case Study',
    'Mentoring-Bestätigung von Teammitglied'
  ]
}

export function EvidenceDialog({
  skillId,
  skillName,
  currentLevel,
  isOpen,
  onClose,
  onSuccess
}: EvidenceDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [level, setLevel] = useState(currentLevel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setError('Titel und Beschreibung sind erforderlich.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await submitEvidence({ skillId, title, description, evidenceUrl, selfLevel: level })
      onSuccess()
      onClose()
    } catch (e) {
      setError('Fehler beim Einreichen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.45)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Evidence einreichen
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{skillName}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Level Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Dein aktuelles Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                      level === l
                        ? 'bg-[#0055FF] text-white border-[#0055FF]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    L{l} · {LEVEL_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Passende Evidence für Level {level}:
              </p>
              <ul className="space-y-1">
                {EVIDENCE_SUGGESTIONS[level]?.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-[#0055FF] mt-0.5">·</span>
                    <span
                      className="cursor-pointer hover:text-[#0055FF]"
                      onClick={() => setTitle(s)}
                    >{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Titel der Evidence *"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
              <textarea
                placeholder="Was hast du konkret getan oder gelernt? *"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] resize-none"
              />
              <input
                type="url"
                placeholder="Link (optional) — Dokument, PR, Präsentation..."
                value={evidenceUrl}
                onChange={e => setEvidenceUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 text-sm font-medium bg-[#0055FF] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Wird eingereicht...' : 'Evidence einreichen'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
```

---

## PHASE 4 — EvidenceTimeline Komponente

```typescript
// src/components/evidence/EvidenceTimeline.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AssessmentStatus } from '@prisma/client'

const EVENT_CONFIG = {
  EVIDENCE_SUBMITTED: {
    icon: '○',
    color: 'text-amber-500',
    dotClass: 'bg-amber-400 border-amber-200'
  },
  SKILL_VALIDATED: {
    icon: '✓',
    color: 'text-[#0055FF]',
    dotClass: 'bg-[#0055FF] border-blue-200'
  },
  SELF_ASSESSED: {
    icon: '·',
    color: 'text-gray-400',
    dotClass: 'bg-gray-300 border-gray-100'
  }
}

interface TimelineEvent {
  id: string
  eventType: string
  title: string
  description?: string | null
  createdAt: Date
  evidence?: {
    skill: { name: string; competenceField: { name: string } }
    selfLevel: number
    validatedLevel?: number | null
    status: AssessmentStatus
    evidenceUrl?: string | null
  } | null
}

interface EvidenceTimelineProps {
  grouped: Record<string, TimelineEvent[]>
}

function formatMonth(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric'
  })
}

export function EvidenceTimeline({ grouped }: EvidenceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const months = Object.keys(grouped).sort().reverse()

  if (months.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Noch keine Einträge</p>
        <p className="text-sm mt-1">Reiche deine erste Evidence ein um die Timeline zu starten.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {months.map(month => (
        <div key={month}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            {formatMonth(month)}
          </h3>
          <div className="space-y-2">
            {grouped[month].map(event => {
              const config = EVENT_CONFIG[event.eventType as keyof typeof EVENT_CONFIG]
                ?? EVENT_CONFIG.SELF_ASSESSED
              const isExpanded = expandedId === event.id

              return (
                <div key={event.id} className="relative pl-6">
                  {/* Timeline-Linie */}
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100" />

                  {/* Dot */}
                  <div className={`absolute left-[-4px] top-3 w-2.5 h-2.5 rounded-full border-2 ${config.dotClass}`} />

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-xs font-medium ${config.color} mr-2`}>
                          {event.evidence?.skill.competenceField.name}
                        </span>
                        <span className="text-sm text-gray-800">{event.title}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">
                        {new Date(event.createdAt).toLocaleDateString('de-DE', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && event.evidence && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 text-sm text-gray-600 space-y-1">
                          <div className="flex gap-4">
                            <span>Selbst: L{event.evidence.selfLevel}</span>
                            {event.evidence.validatedLevel != null && (
                              <span className="text-[#0055FF]">
                                Validiert: L{event.evidence.validatedLevel}
                              </span>
                            )}
                          </div>
                          {event.evidence.evidenceUrl && (
                            <a
                              href={event.evidence.evidenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0055FF] hover:underline text-xs block truncate"
                            >
                              {event.evidence.evidenceUrl}
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## PHASE 5 — ValidationPanel für Functional Leads

```typescript
// src/components/evidence/ValidationPanel.tsx
'use client'

import { useState } from 'react'
import { validateEvidence } from '@/lib/services/evidence-timeline'

interface PendingEvidence {
  id: string
  title: string
  description: string
  evidenceUrl?: string | null
  selfLevel: number
  createdAt: Date
  user: { name?: string | null; email: string }
  skill: { name: string; competenceField: { name: string } }
}

interface ValidationPanelProps {
  pending: PendingEvidence[]
  onValidated: () => void
}

const LEVEL_LABELS = ['', 'L1 Learner', 'L2 Practitioner', 'L3 Advanced', 'L4 Master']

export function ValidationPanel({ pending, onValidated }: ValidationPanelProps) {
  const [validating, setValidating] = useState<string | null>(null)
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  async function handleValidate(evidenceId: string) {
    const validatedLevel = levels[evidenceId]
    if (!validatedLevel) return

    setLoading(true)
    try {
      await validateEvidence({
        evidenceId,
        validatedLevel,
        comment: comments[evidenceId]
      })
      setValidating(null)
      onValidated()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (pending.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>Keine offenen Validierungen</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pending.map(ev => (
        <div
          key={ev.id}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{ev.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ev.user.name ?? ev.user.email} ·{' '}
                {ev.skill.competenceField.name} / {ev.skill.name} ·{' '}
                Selbst: {LEVEL_LABELS[ev.selfLevel]}
              </p>
            </div>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Ausstehend
            </span>
          </div>

          <p className="text-sm text-gray-700">{ev.description}</p>

          {ev.evidenceUrl && (
            <a
              href={ev.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0055FF] hover:underline block truncate"
            >
              {ev.evidenceUrl}
            </a>
          )}

          {validating === ev.id ? (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Bewertetes Level</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map(l => (
                    <button
                      key={l}
                      onClick={() => setLevels(prev => ({ ...prev, [ev.id]: l }))}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        levels[ev.id] === l
                          ? 'bg-[#0055FF] text-white border-[#0055FF]'
                          : 'text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {LEVEL_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                placeholder="Kommentar (optional)"
                value={comments[ev.id] ?? ''}
                onChange={e => setComments(prev => ({ ...prev, [ev.id]: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setValidating(null)}
                  className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleValidate(ev.id)}
                  disabled={!levels[ev.id] || loading}
                  className="flex-1 py-2 text-sm font-medium bg-[#0055FF] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Validieren
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setValidating(ev.id)}
              className="text-sm text-[#0055FF] hover:underline"
            >
              Jetzt validieren →
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

---

## PHASE 6 — PDF Export Button

```typescript
// src/components/evidence/TimelineExportButton.tsx
'use client'

import { useState } from 'react'
import { getTimelineExportData } from '@/lib/services/evidence-timeline'

interface TimelineExportButtonProps {
  userId: string
  userName?: string
}

export function TimelineExportButton({ userId, userName }: TimelineExportButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const data = await getTimelineExportData(userId)

      const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Skill-Portfolio — ${userName ?? userId}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; }
            h1 { font-size: 24px; font-weight: 500; margin-bottom: 4px; }
            .meta { color: #666; font-size: 13px; margin-bottom: 40px; }
            .section { margin-bottom: 32px; }
            .field { font-size: 11px; font-weight: 600; text-transform: uppercase;
                     letter-spacing: 0.08em; color: #0055FF; margin-bottom: 12px; }
            .skill { border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
            .skill-name { font-size: 15px; font-weight: 500; }
            .skill-meta { font-size: 12px; color: #888; margin-top: 4px; }
            .badge { display: inline-block; background: #e8f0ff; color: #0055FF;
                     font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 4px; }
            .validator { font-size: 12px; color: #555; margin-top: 8px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>Skill-Portfolio</h1>
          <div class="meta">
            ${userName ?? ''} · Erstellt am ${new Date().toLocaleDateString('de-DE', {
              day: 'numeric', month: 'long', year: 'numeric'
            })} · ${data.length} validierte Skills
          </div>
          ${Object.entries(
            data.reduce((acc, ev) => {
              const field = ev.skill.competenceField.name
              if (!acc[field]) acc[field] = []
              acc[field].push(ev)
              return acc
            }, {} as Record<string, typeof data>)
          ).map(([field, skills]) => `
            <div class="section">
              <div class="field">${field}</div>
              ${skills.map(ev => `
                <div class="skill">
                  <div class="skill-name">
                    ${ev.skill.name}
                    <span class="badge" style="margin-left:8px">Level ${ev.validatedLevel}</span>
                  </div>
                  <div class="skill-meta">${ev.title}</div>
                  ${ev.validatedBy ? `
                    <div class="validator">
                      Validiert von ${ev.validatedBy.name ?? ev.validatedBy.email} ·
                      ${new Date(ev.validatedAt!).toLocaleDateString('de-DE')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </body>
        </html>
      `

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } catch (e) {
      console.error('Export fehlgeschlagen', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      <span>{loading ? 'Wird erstellt...' : 'Portfolio exportieren'}</span>
    </button>
  )
}
```

---

## PHASE 7 — Seiten einrichten

### 7a — Eigene Timeline-Seite

Erstelle src/app/timeline/page.tsx als Server Component:

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getTimeline } from '@/lib/services/evidence-timeline'
import { EvidenceTimeline } from '@/components/evidence/EvidenceTimeline'
import { TimelineExportButton } from '@/components/evidence/TimelineExportButton'
import { redirect } from 'next/navigation'

export default async function TimelinePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser) redirect('/auth/login')

  const grouped = await getTimeline(dbUser.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Meine Karriere-Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Dokumentierter Skill-Fortschritt</p>
        </div>
        <TimelineExportButton userId={dbUser.id} userName={dbUser.name ?? undefined} />
      </div>
      <EvidenceTimeline grouped={grouped} />
    </div>
  )
}
```

### 7b — Lead Validierungsseite

Erstelle src/app/admin/validations/page.tsx als Server Component:

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getPendingValidations } from '@/lib/services/evidence-timeline'
import { ValidationPanelWrapper } from '@/components/evidence/ValidationPanelWrapper'
import { redirect } from 'next/navigation'

export default async function ValidationsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
  if (!dbUser || dbUser.platformRole === 'USER') redirect('/dashboard')

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

Erstelle src/components/evidence/ValidationPanelWrapper.tsx als Client Component
der den ValidationPanel mit onValidated-Callback und router.refresh() wrapp:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ValidationPanel } from './ValidationPanel'

export function ValidationPanelWrapper({ initialPending }: { initialPending: any[] }) {
  const [pending, setPending] = useState(initialPending)
  const router = useRouter()

  function handleValidated() {
    router.refresh()
  }

  return <ValidationPanel pending={pending} onValidated={handleValidated} />
}
```

---

## PHASE 8 — Navigation erweitern

Füge in der bestehenden Navigation (wahrscheinlich src/components/layout/Navigation.tsx
oder ähnlich) folgende Links hinzu:

- Für alle User: Link zu /timeline mit Label "Meine Timeline"
- Für FUNCTIONAL_LEAD und ADMIN: Link zu /admin/validations mit Badge für
  die Anzahl offener Validierungen

Den Badge-Count als separates async Component implementieren damit er den
Rest der Navigation nicht blockiert:

```typescript
// src/components/layout/ValidationBadge.tsx
import { getPendingValidations } from '@/lib/services/evidence-timeline'

export async function ValidationBadge() {
  const pending = await getPendingValidations()
  if (pending.length === 0) return null
  return (
    <span className="ml-1.5 bg-[#0055FF] text-white text-xs font-medium
                     px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {pending.length}
    </span>
  )
}
```

---

## PHASE 9 — Mentor-Chat Integration

Öffne src/lib/services/mentor-chat.ts und ergänze eine Funktion die nach einem
Level-Up einen Evidence-Nudge generiert. Baue auf der bestehenden Struktur auf:

```typescript
export async function getEvidenceNudge(params: {
  skillName: string
  newLevel: number
  competenceField: string
}): Promise<string> {
  const levelLabels = ['', 'Learner', 'Practitioner', 'Advanced', 'Master']

  // Rufe die bestehende chatWithMentor oder getMentorAdvice Funktion auf
  // mit diesem spezifischen Prompt:
  const prompt = `
    Der Mitarbeiter hat gerade ${params.skillName} (${params.competenceField}) 
    auf Level ${params.newLevel} (${levelLabels[params.newLevel]}) eingeschätzt.
    
    Schreibe eine kurze, motivierende Aufforderung (2 Sätze, informell, Du-Form) 
    die den Mitarbeiter ermutigt, eine konkrete Evidence dafür einzureichen.
    Nenne ein spezifisches Beispiel was als Evidence für L${params.newLevel} 
    in diesem Skill-Bereich passen würde.
    Nur der Text, keine Formatierung.
  `

  // Verwende die bestehende Anthropic-Client-Instanz aus mentor-chat.ts
  // Passe den Aufruf an die vorhandene Implementierung an
}
```

---

## PHASE 10 — Barrel Export und TypeScript Check

Füge die neuen Exports zu src/lib/services/index.ts hinzu — nur wenn die Datei
bereits andere Services re-exportiert. Falls der Index-File Client-seitig importiert
werden könnte: Finger weg, lieber direkte Imports.

Führe zum Abschluss aus:
```bash
npx tsc --noEmit
```

Berichte alle TypeScript-Fehler und fixe sie. Häufige Probleme:
- Fehlende userId_skillId compound unique in Prisma Schema
- supabaseId vs authId Feldname je nach Schema
- platformRole enum Werte (USER vs MEMBER)

Passe alle Feldnamen an das tatsächliche Schema an — das Schema ist die
Quelle der Wahrheit, nicht dieser Prompt.

---

## Zusammenfassung

Am Ende dieser Session sollten folgende Dateien erstellt oder erweitert worden sein:

src/lib/services/evidence-timeline.ts     — vollständig
src/lib/auth/require-user.ts              — neu
src/components/evidence/
  SkillProgressBar.tsx                    — neu
  EvidenceDialog.tsx                      — neu
  EvidenceTimeline.tsx                    — neu
  ValidationPanel.tsx                     — neu
  ValidationPanelWrapper.tsx              — neu
  TimelineExportButton.tsx                — neu
src/app/timeline/page.tsx                 — neu
src/app/admin/validations/page.tsx        — neu
src/components/layout/ValidationBadge.tsx — neu
src/lib/services/mentor-chat.ts           — erweitert (getEvidenceNudge)
src/app/globals.css                       — erweitert (.bg-stripes)

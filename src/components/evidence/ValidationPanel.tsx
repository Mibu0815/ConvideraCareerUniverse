'use client'

import { useState } from 'react'
import { validateEvidence } from '@/lib/services/evidence-timeline'

export interface PendingEvidenceView {
  id: string
  title: string
  description: string
  evidenceUrl?: string | null
  selfLevel: number
  createdAt: Date | string
  user: { name?: string | null; email: string }
  skill: { title: string; CompetenceField: { title: string } }
}

interface ValidationPanelProps {
  pending: PendingEvidenceView[]
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
        comment: comments[evidenceId],
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
      {pending.map((ev) => (
        <div
          key={ev.id}
          className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{ev.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ev.user.name ?? ev.user.email} ·{' '}
                {ev.skill.CompetenceField.title} / {ev.skill.title} · Selbst:{' '}
                {LEVEL_LABELS[ev.selfLevel]}
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
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Bewertetes Level
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((l) => (
                    <button
                      key={l}
                      onClick={() =>
                        setLevels((prev) => ({ ...prev, [ev.id]: l }))
                      }
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
                onChange={(e) =>
                  setComments((prev) => ({ ...prev, [ev.id]: e.target.value }))
                }
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

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AssessmentStatus } from '@prisma/client'

const EVENT_CONFIG = {
  EVIDENCE_SUBMITTED: {
    icon: '○',
    color: 'text-amber-500',
    dotClass: 'bg-amber-400 border-amber-200',
  },
  SKILL_VALIDATED: {
    icon: '✓',
    color: 'text-[#0055FF]',
    dotClass: 'bg-[#0055FF] border-blue-200',
  },
  SELF_ASSESSED: {
    icon: '·',
    color: 'text-gray-400',
    dotClass: 'bg-gray-300 border-gray-100',
  },
}

export interface TimelineEventView {
  id: string
  eventType: string
  title: string
  description?: string | null
  createdAt: Date | string
  evidence?: {
    skill: { title: string; CompetenceField: { title: string } }
    selfLevel: number
    validatedLevel?: number | null
    status: AssessmentStatus
    evidenceUrl?: string | null
  } | null
}

interface EvidenceTimelineProps {
  grouped: Record<string, TimelineEventView[]>
}

function formatMonth(key: string) {
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('de-DE', {
    month: 'long',
    year: 'numeric',
  })
}

export function EvidenceTimeline({ grouped }: EvidenceTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const months = Object.keys(grouped).sort().reverse()

  if (months.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">Noch keine Einträge</p>
        <p className="text-sm mt-1">
          Reiche deine erste Evidence ein um die Timeline zu starten.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {months.map((month) => (
        <div key={month}>
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
            {formatMonth(month)}
          </h3>
          <div className="space-y-2">
            {grouped[month].map((event) => {
              const config =
                EVENT_CONFIG[event.eventType as keyof typeof EVENT_CONFIG] ??
                EVENT_CONFIG.SELF_ASSESSED
              const isExpanded = expandedId === event.id

              return (
                <div key={event.id} className="relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-100" />
                  <div
                    className={`absolute left-[-4px] top-3 w-2.5 h-2.5 rounded-full border-2 ${config.dotClass}`}
                  />

                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : event.id)
                    }
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        {event.evidence?.skill.CompetenceField.title && (
                          <span
                            className={`text-xs font-medium ${config.color} mr-2`}
                          >
                            {event.evidence.skill.CompetenceField.title}
                          </span>
                        )}
                        <span className="text-sm text-gray-800">
                          {event.title}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">
                        {new Date(event.createdAt).toLocaleDateString('de-DE', {
                          day: 'numeric',
                          month: 'short',
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

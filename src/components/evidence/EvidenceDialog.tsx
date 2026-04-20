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
    'Link zu einem Fachartikel mit eigenem Kommentar',
  ],
  2: [
    'Link zu einem Projekt-Deliverable',
    'Peer-Feedback Screenshot',
    'Präsentation oder Dokumentation die du erstellt hast',
  ],
  3: [
    'Projektleiter-Bestätigung per E-Mail',
    'Code-Review Feedback oder PR-Link',
    'Kundenfeedback oder Stakeholder-Mail',
  ],
  4: [
    'Intern gehaltene Schulung oder Workshop',
    'Veröffentlichter Artikel oder Case Study',
    'Mentoring-Bestätigung von Teammitglied',
  ],
}

export function EvidenceDialog({
  skillId,
  skillName,
  currentLevel,
  isOpen,
  onClose,
  onSuccess,
}: EvidenceDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [level, setLevel] = useState(currentLevel || 1)
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
      await submitEvidence({
        skillId,
        title,
        description,
        evidenceUrl: evidenceUrl || undefined,
        selfLevel: level,
      })
      onSuccess()
      onClose()
    } catch {
      setError('Fehler beim Einreichen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        >
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
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Dein aktuelles Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((l) => (
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

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">
                Passende Evidence für Level {level}:
              </p>
              <ul className="space-y-1">
                {EVIDENCE_SUGGESTIONS[level]?.map((s, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-600 flex items-start gap-1.5"
                  >
                    <span className="text-[#0055FF] mt-0.5">·</span>
                    <span
                      className="cursor-pointer hover:text-[#0055FF]"
                      onClick={() => setTitle(s)}
                    >
                      {s}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Titel der Evidence *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
              <textarea
                placeholder="Was hast du konkret getan oder gelernt? *"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF] resize-none"
              />
              <input
                type="url"
                placeholder="Link (optional) — Dokument, PR, Präsentation..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0055FF]/20 focus:border-[#0055FF]"
              />
            </div>

            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

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

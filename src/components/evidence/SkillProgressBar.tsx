'use client'

import { motion } from 'framer-motion'
import type { AssessmentStatus } from '@prisma/client'

interface SkillProgressBarProps {
  skillName: string
  selfLevel: number
  validatedLevel?: number | null
  requiredLevel: number
  status: AssessmentStatus
  maxLevel?: number
  onEvidenceClick?: () => void
}

const STATUS_CONFIG: Record<
  AssessmentStatus,
  { label: string; barClass: string; showHatch: boolean }
> = {
  SELF_ASSESSED: {
    label: 'Selbst eingeschätzt',
    barClass: 'bg-gray-300',
    showHatch: false,
  },
  EVIDENCE_SUBMITTED: {
    label: 'Prüfung ausstehend',
    barClass: 'bg-amber-400',
    showHatch: true,
  },
  VALIDATED: {
    label: 'Validiert',
    barClass: 'bg-[#0055FF]',
    showHatch: false,
  },
}

export function SkillProgressBar({
  skillName,
  selfLevel,
  validatedLevel,
  requiredLevel,
  status,
  maxLevel = 4,
  onEvidenceClick,
}: SkillProgressBarProps) {
  const config = STATUS_CONFIG[status]
  const displayLevel =
    status === 'VALIDATED' && validatedLevel != null ? validatedLevel : selfLevel
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
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
          style={{ left: `${(requiredLevel / maxLevel) * 100}%` }}
        />
        <motion.div
          className={`h-full rounded-full ${config.barClass} ${
            config.showHatch ? 'bg-stripes' : ''
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        />
      </div>

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

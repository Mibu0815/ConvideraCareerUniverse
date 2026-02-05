'use client'

import { useRouter } from 'next/navigation'
import { Target, ArrowRight, Sparkles, TrendingUp, Flame } from 'lucide-react'

interface SkillGap {
  skillId: string
  skillName: string
  competenceFieldName: string
  currentLevel: number
  requiredLevel: number
  gapSize: number
  priority: 'CRITICAL' | 'GROWTH' | 'STRETCH'
}

interface LearningPathViewProps {
  gaps: SkillGap[]
  focusedCount: number
  totalGaps: number
  currentRoleName: string | null
  targetRoleName: string | null
}

const priorityConfig = {
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Flame,
  },
  GROWTH: {
    label: 'Growth',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: TrendingUp,
  },
  STRETCH: {
    label: 'Stretch',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: Sparkles,
  },
}

function SkillGapBadge({ currentLevel, requiredLevel }: { currentLevel: number; requiredLevel: number }) {
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
        L{currentLevel}
      </span>
      <ArrowRight className="w-3 h-3 text-slate-400" />
      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
        L{requiredLevel}
      </span>
    </div>
  )
}

function SkillRow({ gap }: { gap: SkillGap }) {
  const config = priorityConfig[gap.priority]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className={`p-1.5 rounded-md ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {gap.skillName}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {gap.competenceFieldName}
        </p>
      </div>
      <SkillGapBadge currentLevel={gap.currentLevel} requiredLevel={gap.requiredLevel} />
    </div>
  )
}

export function LearningPathView({
  gaps,
  focusedCount,
  totalGaps,
  currentRoleName,
  targetRoleName,
}: LearningPathViewProps) {
  const router = useRouter()

  // Show top 3 gaps by priority
  const topGaps = gaps.slice(0, 3)

  if (gaps.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900">Alle Skills erreicht!</h3>
            <p className="text-sm text-emerald-700">
              Du hast alle Skill-Anforderungen erfüllt.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <Target className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Lernpfad</h3>
            {targetRoleName && currentRoleName !== targetRoleName && (
              <p className="text-xs text-slate-500">
                {currentRoleName} → <span className="text-blue-600 font-medium">{targetRoleName}</span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{totalGaps}</p>
          <p className="text-xs text-slate-500">Skills mit Gap</p>
        </div>
      </div>

      {/* Focus indicator */}
      {focusedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
          <Target className="w-4 h-4" />
          <span>{focusedCount} von 3 Focus-Slots belegt</span>
        </div>
      )}

      {/* Top skill gaps */}
      <div className="space-y-2">
        {topGaps.map((gap) => (
          <SkillRow key={gap.skillId} gap={gap} />
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => router.push('/learning-journey')}
        className="w-full py-3 px-4 bg-slate-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
      >
        Zur Learning Journey
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

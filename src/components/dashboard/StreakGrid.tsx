import { cn } from '@/lib/utils'
import type { StreakDay } from '@/lib/services/dashboard'

interface StreakGridProps {
  days: StreakDay[]
  currentStreak: number
  totalActiveDays: number
}

const intensityClasses: Record<0 | 1 | 2 | 3, string> = {
  0: 'bg-border',
  1: 'bg-zone-personal/30',
  2: 'bg-zone-personal/60',
  3: 'bg-zone-personal',
}

const intensityLabel = (day: StreakDay): string => {
  if (day.intensity === 0) return `${day.date}: keine Aktivität`
  return `${day.date}: ${day.events} Event${day.events === 1 ? '' : 's'}`
}

export function StreakGrid({ days, currentStreak, totalActiveDays }: StreakGridProps) {
  if (days.length === 0) return null

  // Mo=0 ... Sun=6 — first column starts on the actual weekday of days[0]
  const firstDate = new Date(days[0].date)
  const firstWeekday = (firstDate.getDay() + 6) % 7

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <p className="text-caption uppercase text-text-muted">Dein Momentum</p>
          <p className="text-h3 text-text-primary mt-1">
            {currentStreak > 0
              ? `${currentStreak} ${currentStreak === 1 ? 'Tag' : 'Tage'} aktiv in Folge`
              : 'Starte heute deinen Streak'}
          </p>
          <p className="text-body-s text-text-secondary mt-1">
            {totalActiveDays} von 56 Tagen aktiv
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid grid-flow-col auto-cols-[14px] gap-1.5"
          style={{ gridTemplateRows: 'repeat(7, 14px)' }}
        >
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`offset-${i}`} className="w-[14px] h-[14px]" aria-hidden />
          ))}

          {days.map(day => (
            <div
              key={day.date}
              title={intensityLabel(day)}
              className={cn(
                'w-[14px] h-[14px] rounded-sm transition-colors',
                intensityClasses[day.intensity],
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4 text-caption text-text-muted">
        <span>Weniger</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-border" aria-hidden />
          <div className="w-3 h-3 rounded-sm bg-zone-personal/30" aria-hidden />
          <div className="w-3 h-3 rounded-sm bg-zone-personal/60" aria-hidden />
          <div className="w-3 h-3 rounded-sm bg-zone-personal" aria-hidden />
        </div>
        <span>Mehr</span>
      </div>
    </div>
  )
}

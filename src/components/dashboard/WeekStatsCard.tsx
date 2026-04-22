import { Card } from '@/components/layout'
import type { WeekStats } from '@/lib/services/dashboard'

interface WeekStatsCardProps {
  stats: WeekStats
}

export function WeekStatsCard({ stats }: WeekStatsCardProps) {
  const total = stats.impulsesCompleted + stats.evidenceSubmitted + stats.validationsReceived

  return (
    <Card variant="default">
      <p className="text-caption uppercase text-text-muted mb-4">Diese Woche</p>
      {total === 0 ? (
        <p className="text-body-s text-text-secondary">Noch keine Aktivität diese Woche.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-h2 text-text-primary">{stats.impulsesCompleted}</p>
            <p className="text-body-s text-text-secondary mt-1">
              {stats.impulsesCompleted === 1 ? 'Impuls' : 'Impulse'} abgeschlossen
            </p>
          </div>
          <div>
            <p className="text-h2 text-text-primary">{stats.evidenceSubmitted}</p>
            <p className="text-body-s text-text-secondary mt-1">Evidence eingereicht</p>
          </div>
          <div>
            <p className="text-h2 text-text-primary">{stats.validationsReceived}</p>
            <p className="text-body-s text-text-secondary mt-1">
              {stats.validationsReceived === 1 ? 'Validierung' : 'Validierungen'} erhalten
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserState } from '@/lib/userStateGuard'
import { Navigation } from '@/components/shared/Navigation'
import { ValidationBadge } from '@/components/shared/ValidationBadge'
import { PageShell } from '@/components/layout'
import {
  DashboardGreeting,
  StreakGrid,
  NextStepsCard,
  PathSnapshotCard,
  WeekStatsCard,
  AdminResponsibilitiesCard,
} from '@/components/dashboard'
import {
  getActivityStreak,
  getNextStepSuggestions,
  getPathSnapshot,
  getWeekStats,
  getAdminResponsibilities,
} from '@/lib/services/dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser?.email) {
    redirect('/auth/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      currentRoleId: true,
      platformRole: true,
    },
  })

  if (!user) redirect('/auth/login')

  const userState = await getUserState(user.id)
  if (userState.state === 'onboarding') {
    redirect('/my-career')
  }

  const [streak, nextSteps, pathSnapshot, weekStats, adminResp] = await Promise.all([
    getActivityStreak(),
    getNextStepSuggestions(),
    getPathSnapshot(),
    getWeekStats(),
    getAdminResponsibilities(),
  ])

  return (
    <>
      <Navigation
        userName={user.name ?? user.email}
        platformRole={user.platformRole}
        validationBadge={<ValidationBadge />}
      />
      <PageShell width="full">
        <DashboardGreeting name={user.name ?? undefined} />

        <div className="mb-10">
          <StreakGrid
            days={streak.days}
            currentStreak={streak.currentStreak}
            totalActiveDays={streak.totalActiveDays}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <NextStepsCard steps={nextSteps} />
          </div>
          <div>
            <PathSnapshotCard snapshot={pathSnapshot} />
          </div>
        </div>

        <div className="mb-10">
          <WeekStatsCard stats={weekStats} />
        </div>

        {adminResp && (
          <div className="mb-10">
            <AdminResponsibilitiesCard responsibilities={adminResp} />
          </div>
        )}
      </PageShell>
    </>
  )
}

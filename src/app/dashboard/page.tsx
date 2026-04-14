// src/app/dashboard/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser, getDashboardKPIs } from '@/app/actions/auth'
import { getRoles } from '@/app/actions/get-roles'
import { DashboardContent } from './components/DashboardContent'
import { OnboardingWizard } from './components/OnboardingWizard'

// Loading skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-brand-gray-50 p-8">
      <div className="max-w-6xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-brand-gray-200 rounded mb-2" />
        <div className="h-4 w-48 bg-brand-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-brand-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-brand-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

async function DashboardLoader() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Check if first-time user needs onboarding
  if (user.isFirstLogin) {
    const roles = await getRoles()
    return <OnboardingWizard user={user} groupedRoles={roles} />
  }

  // Get KPIs for dashboard
  const kpis = await getDashboardKPIs(user.id)

  return <DashboardContent user={user} kpis={kpis} />
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLoader />
    </Suspense>
  )
}

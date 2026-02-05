// src/app/learning-journey/page.tsx

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { BlobBackground, Navigation } from "@/components/shared"
import { getCurrentUser } from "@/app/actions/user-sync"
import {
  getLearningRoadmap,
  generateOrRefreshLearningPlan,
  getLearningPlanWithItems,
  setSkillFocus,
  removeSkillFocus,
  generateStructuredImpulse,
  updateImpulseStep,
  saveImpulseEvidence
} from "@/app/actions/learning-journey"
import { LearningRoadmap } from "@/components/learning-journey"
import type { ImpulseStep } from "@prisma/client"

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    </div>
  )
}

// Server-side data fetching
async function LearningJourneyContent({ userId }: { userId: string }) {
  // Generate/refresh the learning plan
  const { planId } = await generateOrRefreshLearningPlan(userId)

  // Load roadmap and plan data
  const [roadmap, plan] = await Promise.all([
    getLearningRoadmap(userId),
    getLearningPlanWithItems(userId)
  ])

  if (!plan) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <p className="text-muted-foreground">Kein Lernplan gefunden.</p>
      </div>
    )
  }

  // Server actions wrapped for client components
  async function handleSetFocus(planId: string, skillId: string) {
    "use server"
    return setSkillFocus(planId, skillId, userId)
  }

  async function handleRemoveFocus(planId: string, skillId: string) {
    "use server"
    return removeSkillFocus(planId, skillId, userId)
  }

  async function handleGenerateImpulse(focusId: string) {
    "use server"
    return generateStructuredImpulse(focusId, userId)
  }

  async function handleUpdateStep(impulseId: string, step: ImpulseStep, data?: { reflection?: string }) {
    "use server"
    return updateImpulseStep(impulseId, step, data)
  }

  async function handleSaveEvidence(impulseId: string, reflection: string) {
    "use server"
    return saveImpulseEvidence(impulseId, reflection, userId)
  }

  return (
    <div className="min-h-screen bg-brand-gray-50 bg-grid">
      <BlobBackground />
      <Navigation />
      <div className="container mx-auto max-w-4xl pt-24 pb-24 sm:pb-8 px-4">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-convidera-dark">
            Deine Learning Journey
          </h1>
          {roadmap.meta.currentRoleName && (
            <p className="mt-2 text-brand-gray-500">
              {roadmap.meta.currentRoleName}
              {roadmap.meta.targetRoleName && roadmap.meta.targetRoleName !== roadmap.meta.currentRoleName && (
                <> → <span className="text-convidera-blue font-medium">{roadmap.meta.targetRoleName}</span></>
              )}
            </p>
          )}
          <p className="mt-1 text-sm text-brand-gray-400">
            {roadmap.meta.totalGaps} Skill{roadmap.meta.totalGaps !== 1 ? "s" : ""} mit Entwicklungspotenzial
          </p>
        </header>

        <LearningRoadmap
          plan={plan}
          roadmap={roadmap}
          userId={userId}
          onSetFocus={handleSetFocus}
          onRemoveFocus={handleRemoveFocus}
          onGenerateImpulse={handleGenerateImpulse}
          onUpdateStep={handleUpdateStep}
          onSaveEvidence={handleSaveEvidence}
        />
      </div>
    </div>
  )
}

export default async function LearningJourneyPage() {
  // Get the authenticated user
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!user.currentRoleId) {
    redirect('/onboarding')
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LearningJourneyContent userId={user.id} />
    </Suspense>
  )
}

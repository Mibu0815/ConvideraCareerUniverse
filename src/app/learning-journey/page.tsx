// src/app/learning-journey/page.tsx

import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Navigation } from "@/components/shared"
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
import { LearningJourneyView } from "@/components/learning-journey"
import type { ImpulseStep } from "@prisma/client"

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-200" />
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded-lg" />
          <div className="h-6 w-72 bg-gray-100 rounded" />
          <div className="h-40 bg-white rounded-2xl border border-gray-100" />
          <div className="h-32 bg-white rounded-2xl border border-gray-100" />
          <div className="h-32 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    </div>
  )
}

// Server-side data fetching
async function LearningJourneyContent({ userId, userName }: { userId: string; userName: string | null }) {
  // Generate/refresh the learning plan
  const { planId } = await generateOrRefreshLearningPlan(userId)

  // Load roadmap and plan data
  const [roadmap, plan] = await Promise.all([
    getLearningRoadmap(userId),
    getLearningPlanWithItems(userId)
  ])

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation userName={userName} />
        <div className="max-w-2xl mx-auto px-4 pt-24 pb-8 text-center">
          <p className="text-gray-500">Noch kein Lernplan vorhanden.</p>
          <p className="text-sm text-gray-400 mt-2">
            Wähle zuerst deine aktuelle und Zielrolle aus.
          </p>
        </div>
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
    <LearningJourneyView
      plan={plan}
      roadmap={roadmap}
      userId={userId}
      userName={userName}
      onSetFocus={handleSetFocus}
      onRemoveFocus={handleRemoveFocus}
      onGenerateImpulse={handleGenerateImpulse}
      onUpdateStep={handleUpdateStep}
      onSaveEvidence={handleSaveEvidence}
    />
  )
}

export default async function LearningJourneyPage() {
  // Get the authenticated user
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  if (!user.currentRoleId) {
    redirect('/my-career')
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LearningJourneyContent userId={user.id} userName={user.name} />
    </Suspense>
  )
}

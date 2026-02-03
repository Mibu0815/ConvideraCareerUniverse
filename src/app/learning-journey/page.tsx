// src/app/learning-journey/page.tsx

import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
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
    <div className="container mx-auto max-w-4xl py-8 pb-24 sm:pb-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">
          Deine Learning Journey
        </h1>
        {roadmap.meta.currentRoleName && (
          <p className="mt-2 text-muted-foreground">
            {roadmap.meta.currentRoleName}
            {roadmap.meta.targetRoleName && roadmap.meta.targetRoleName !== roadmap.meta.currentRoleName && (
              <> → <span className="text-primary font-medium">{roadmap.meta.targetRoleName}</span></>
            )}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {roadmap.meta.totalGaps} Skill{roadmap.meta.totalGaps !== 1 ? "s" : ""} mit Entwicklungspotenzial
        </p>
      </header>

      <LearningRoadmap
        plan={plan}
        roadmap={roadmap}
        onSetFocus={handleSetFocus}
        onRemoveFocus={handleRemoveFocus}
        onGenerateImpulse={handleGenerateImpulse}
        onUpdateStep={handleUpdateStep}
        onSaveEvidence={handleSaveEvidence}
      />
    </div>
  )
}

export default async function LearningJourneyPage() {
  // For demo: get the first user with a currentRoleId
  // In production, this would use auth to get the current user
  const demoUser = await prisma.user.findFirst({
    where: {
      currentRoleId: { not: null },
      isActive: true
    },
    orderBy: { createdAt: "asc" }
  })

  if (!demoUser) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Learning Journey</h1>
        <p className="text-muted-foreground">
          Kein User mit zugewiesener Rolle gefunden. Bitte erstelle zuerst einen User mit einer aktuellen Rolle.
        </p>
      </div>
    )
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LearningJourneyContent userId={demoUser.id} />
    </Suspense>
  )
}

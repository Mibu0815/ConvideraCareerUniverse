// src/components/learning-journey/LearningJourneyView.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, Target, ChevronDown, Check } from "lucide-react"
import { Navigation } from "@/components/shared"
import { SkillTimelineItem } from "./SkillTimelineItem"
import { useFocusSkill } from "@/context"
import type { LearningRoadmap as RoadmapType } from "@/app/actions/learning-journey"
import type { StructuredImpulse } from "@/types/practical-impulse"
import type { ImpulseStep } from "@prisma/client"

interface Props {
  plan: any
  roadmap: RoadmapType
  userId: string
  userName: string | null
  onSetFocus: (planId: string, skillId: string) => Promise<{ success: boolean; error?: string }>
  onRemoveFocus: (planId: string, skillId: string) => Promise<{ success: boolean }>
  onGenerateImpulse: (focusId: string) => Promise<StructuredImpulse>
  onUpdateStep: (impulseId: string, step: ImpulseStep, data?: { reflection?: string }) => Promise<{ success: boolean }>
  onSaveEvidence: (impulseId: string, reflection: string) => Promise<{ success: boolean; evidenceNoteId: string }>
}

export function LearningJourneyView({
  plan,
  roadmap,
  userId,
  userName,
  onSetFocus,
  onRemoveFocus,
  onGenerateImpulse,
  onUpdateStep,
  onSaveEvidence
}: Props) {
  const router = useRouter()
  const { initializeFromServerData } = useFocusSkill()

  // Get focused skills (IN_PROGRESS)
  const focusedSkills = plan.LearningFocus.filter(
    (item: any) => item.status === "IN_PROGRESS"
  )

  // Sync to global context (use plan as dep, not focusedSkills which is recreated each render)
  useEffect(() => {
    // Map focused skills to context format
    const inProgressSkills = focusedSkills.map((item: any) => ({
      skillId: item.skillId,
      skillName: item.Skill?.title || 'Skill',
      competenceFieldName: item.CompetenceField?.name || null,
      currentLevel: item.currentLevel,
      targetLevel: item.targetLevel,
      learningFocusId: item.id,
    }))

    // Find active impulse from focused skills
    let activeImpulse = null
    for (const item of focusedSkills) {
      const impulses = item.PracticalImpulse || []
      const active = impulses.find((i: any) => i.currentStep !== 'EVIDENCE' || !i.evidenceSaved)
      if (active) {
        activeImpulse = active
        break
      }
    }

    // Count completed impulses
    const completedCount = focusedSkills.reduce((acc: number, item: any) => {
      const impulses = item.PracticalImpulse || []
      return acc + impulses.filter((i: any) => i.evidenceSaved).length
    }, 0)

    initializeFromServerData({
      inProgressSkills,
      activeImpulse,
      completedImpulsesCount: completedCount,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, initializeFromServerData])

  // Get other skills (not focused, not completed)
  const backlogSkills = plan.LearningFocus.filter(
    (item: any) => item.status === "NOT_STARTED"
  )

  // Get completed skills
  const completedSkills = plan.LearningFocus.filter(
    (item: any) => item.status === "COMPLETED"
  )

  const handleRefresh = () => {
    router.refresh()
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Guten Morgen"
    if (hour < 18) return "Hallo"
    return "Guten Abend"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userName={userName} />

      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        {/* Hero Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-gray-500 text-sm mb-1">{getGreeting()}, {userName || "Lernender"}</p>
          <h1 className="text-3xl font-bold text-gray-900">
            Deine Learning Journey
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-gray-600">
              {roadmap.meta.currentRoleName}
            </span>
            {roadmap.meta.targetRoleName && roadmap.meta.targetRoleName !== roadmap.meta.currentRoleName && (
              <>
                <span className="text-gray-300">→</span>
                <span className="text-sm font-medium text-convidera-blue">
                  {roadmap.meta.targetRoleName}
                </span>
              </>
            )}
          </div>
        </motion.header>

        {/* Focus Zone - Top 3 Skills */}
        {focusedSkills.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-convidera-blue" />
                Heute arbeitest du an
              </h2>
              <span className="text-xs text-gray-400">
                {focusedSkills.length}/3 Fokus
              </span>
            </div>

            <div className="space-y-4">
              {focusedSkills.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.1 }}
                >
                  <SkillTimelineItem
                    item={item}
                    planId={plan.id}
                    userId={userId}
                    canFocus={focusedSkills.length < 3}
                    priorityColor="border-convidera-blue"
                    onSetFocus={onSetFocus}
                    onRemoveFocus={onRemoveFocus}
                    onGenerateImpulse={onGenerateImpulse}
                    onUpdateStep={onUpdateStep}
                    onSaveEvidence={onSaveEvidence}
                    onRefresh={handleRefresh}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        ) : (
          // Empty state - no focus skills
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-convidera-blue/10 flex items-center justify-center">
                <Target className="w-8 h-8 text-convidera-blue" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Wähle deinen ersten Fokus-Skill
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Wähle bis zu 3 Skills aus, an denen du aktiv arbeiten möchtest.
                Scrolle nach unten, um deine Skills zu sehen.
              </p>
            </div>
          </motion.section>
        )}

        {/* Backlog Skills */}
        {backlogSkills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <details className="group" open={focusedSkills.length === 0}>
              <summary className="flex items-center justify-between cursor-pointer list-none mb-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Weitere Skills ({backlogSkills.length})
                </h2>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3">
                {backlogSkills.map((item: any, index: number) => (
                  <SkillTimelineItem
                    key={item.id}
                    item={item}
                    planId={plan.id}
                    userId={userId}
                    canFocus={focusedSkills.length < 3}
                    priorityColor="border-gray-200"
                    onSetFocus={onSetFocus}
                    onRemoveFocus={onRemoveFocus}
                    onGenerateImpulse={onGenerateImpulse}
                    onUpdateStep={onUpdateStep}
                    onSaveEvidence={onSaveEvidence}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </details>
          </motion.section>
        )}

        {/* Completed Skills */}
        {completedSkills.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer list-none mb-4">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Abgeschlossen ({completedSkills.length})
                </h2>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
              </summary>

              <div className="space-y-3 opacity-60">
                {completedSkills.map((item: any) => (
                  <SkillTimelineItem
                    key={item.id}
                    item={item}
                    planId={plan.id}
                    userId={userId}
                    canFocus={false}
                    priorityColor="border-emerald-200"
                    onSetFocus={onSetFocus}
                    onRemoveFocus={onRemoveFocus}
                    onGenerateImpulse={onGenerateImpulse}
                    onUpdateStep={onUpdateStep}
                    onSaveEvidence={onSaveEvidence}
                    onRefresh={handleRefresh}
                  />
                ))}
              </div>
            </details>
          </motion.section>
        )}

        {/* Empty State */}
        {roadmap.meta.totalGaps === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Alle Skills erreicht!
            </h2>
            <p className="text-gray-500">
              Du hast alle Skill-Anforderungen für deine Zielrolle erfüllt.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}

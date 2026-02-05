"use server"

import { prisma } from "@/lib/prisma"
import { FocusPriority, FocusStatus, ImpulseStep, ImpulseLevel } from "@prisma/client"
import { getImpulseLevel, getImpulseConfig } from "@/lib/impulse-levels"
import type { StructuredImpulse, GeneratedImpulse } from "@/types/practical-impulse"
import { logActivity } from "./admin-analytics"

// ─── Typen ───────────────────────────────────────────────

interface SkillGap {
  skillId: string
  skillName: string
  competenceFieldId: string
  competenceFieldName: string
  competenceFieldSlug: string
  currentLevel: number
  requiredLevel: number
  gapSize: number
  priority: FocusPriority
  mentorUserId: string | null
  mentorName: string | null
}

export interface LearningRoadmap {
  critical: SkillGap[]   // CRITICAL: gapSize >= 2 ODER currentLevel === 0
  growth: SkillGap[]     // GROWTH: gapSize === 1, Skill ist in aktueller Rolle
  stretch: SkillGap[]    // STRETCH: Skill ist in Target Role, nicht in aktueller
  meta: {
    totalGaps: number
    currentRoleId: string | null
    currentRoleName: string | null
    targetRoleId: string | null
    targetRoleName: string | null
    generatedAt: Date
  }
}

// ─── Horizont-Klassifikation ──────────────────────────────

function classifyPriority(
  gap: { currentLevel: number; requiredLevel: number; gapSize: number },
  isTargetRoleOnly: boolean
): FocusPriority {
  // Stretch-Skills (nur in der Zielrolle, nicht in aktueller Rolle gefordert)
  if (isTargetRoleOnly) return "STRETCH"

  // Critical: Großer Gap (>=2 Level) ODER User steht bei 0
  if (gap.gapSize >= 2 || gap.currentLevel === 0) return "CRITICAL"

  // Growth: Moderater Gap (1 Level Differenz)
  return "GROWTH"
}

// ─── Haupt-Action: Roadmap laden ──────────────────────────

export async function getLearningRoadmap(userId: string): Promise<LearningRoadmap> {
  // 1. User mit Assessments und CareerGoals laden
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      SkillAssessment: {
        orderBy: { updatedAt: "desc" }
      },
      CareerGoal: {
        where: { status: { in: ["EXPLORING", "COMMITTED"] } },
        orderBy: { priority: "asc" },
        take: 1
      }
    }
  })

  // 2. Aktuelle Rolle mit Skills laden (falls vorhanden)
  const currentRole = user.currentRoleId
    ? await prisma.role.findUnique({
        where: { id: user.currentRoleId },
        include: {
          RoleSkill: {
            include: {
              Skill: {
                include: {
                  CompetenceField: {
                    include: { Owner: true }
                  }
                }
              }
            }
          }
        }
      })
    : null

  // 3. Target Role aus CareerGoal laden (falls vorhanden)
  const targetGoal = user.CareerGoal[0]
  const targetRole = targetGoal
    ? await prisma.role.findUnique({
        where: { id: targetGoal.roleId },
        include: {
          RoleSkill: {
            include: {
              Skill: {
                include: {
                  CompetenceField: {
                    include: { Owner: true }
                  }
                }
              }
            }
          }
        }
      })
    : null

  // 4. Assessment-Lookup erstellen (skillId → aktuelles Level)
  // Prefer validatedLevel over selfLevel
  const assessmentMap = new Map<string, number>()
  for (const a of user.SkillAssessment) {
    if (!assessmentMap.has(a.skillId)) {
      assessmentMap.set(a.skillId, a.validatedLevel ?? a.selfLevel)
    }
  }

  // 5. Skills der aktuellen Rolle als Set (für Target-Role-Differenzierung)
  const currentRoleSkillIds = new Set(
    currentRole?.RoleSkill.map(rs => rs.skillId) ?? []
  )

  // 6. Alle relevanten Requirements sammeln (aktuelle + Zielrolle)
  type SkillReq = NonNullable<typeof currentRole>["RoleSkill"][0]
  const allRequirements: SkillReq[] = [
    ...(currentRole?.RoleSkill ?? []),
    ...(targetRole?.RoleSkill ?? [])
  ]

  // 7. Deduplizieren (bei Überschneidung: höheres Required Level gewinnt)
  const requirementMap = new Map<string, SkillReq>()
  for (const req of allRequirements) {
    const existing = requirementMap.get(req.skillId)
    if (!existing || req.minLevel > existing.minLevel) {
      requirementMap.set(req.skillId, req)
    }
  }

  // 8. Gaps berechnen
  const gaps: SkillGap[] = []

  for (const [skillId, req] of requirementMap) {
    const currentLevel = assessmentMap.get(skillId) ?? 0
    const gapSize = req.minLevel - currentLevel

    if (gapSize <= 0) continue // Kein Gap — Skill bereits erfüllt

    const isTargetRoleOnly = !currentRoleSkillIds.has(skillId)
    const cf = req.Skill.CompetenceField

    gaps.push({
      skillId: req.skillId,
      skillName: req.Skill.title,
      competenceFieldId: cf.id,
      competenceFieldName: cf.title,
      competenceFieldSlug: cf.slug,
      currentLevel,
      requiredLevel: req.minLevel,
      gapSize,
      priority: classifyPriority({ currentLevel, requiredLevel: req.minLevel, gapSize }, isTargetRoleOnly),
      mentorUserId: cf.Owner?.id ?? null,
      mentorName: cf.Owner?.name ?? null
    })
  }

  // 8. Sortierung: innerhalb jeder Priority nach gapSize desc, dann alphabetisch
  const sorted = gaps.sort((a, b) => b.gapSize - a.gapSize || a.skillName.localeCompare(b.skillName))

  return {
    critical: sorted.filter(g => g.priority === "CRITICAL"),
    growth: sorted.filter(g => g.priority === "GROWTH"),
    stretch: sorted.filter(g => g.priority === "STRETCH"),
    meta: {
      totalGaps: gaps.length,
      currentRoleId: currentRole?.id ?? null,
      currentRoleName: currentRole?.title ?? null,
      targetRoleId: targetRole?.id ?? null,
      targetRoleName: targetRole?.title ?? null,
      generatedAt: new Date()
    }
  }
}

// ─── Fokus setzen (max. 3) ────────────────────────────────

export async function setSkillFocus(
  learningPlanId: string,
  skillId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Verify ownership
  const plan = await prisma.learningPlan.findUnique({
    where: { id: learningPlanId }
  })
  if (!plan || plan.userId !== userId) {
    return { success: false, error: "Plan nicht gefunden" }
  }

  // Check if already 3 skills focused
  const currentFocusCount = await prisma.learningFocus.count({
    where: {
      learningPlanId,
      status: "IN_PROGRESS"
    }
  })

  if (currentFocusCount >= 3) {
    return {
      success: false,
      error: "Maximal 3 Skills können gleichzeitig fokussiert werden. Pausiere oder schließe zuerst einen ab."
    }
  }

  // Find the focus item
  const focusItem = await prisma.learningFocus.findFirst({
    where: { learningPlanId, skillId }
  })

  if (!focusItem) {
    return { success: false, error: "Skill nicht im Plan gefunden" }
  }

  // Activate focus
  const updatedFocus = await prisma.learningFocus.update({
    where: { id: focusItem.id },
    data: {
      status: "IN_PROGRESS",
      focusOrder: currentFocusCount + 1,
      focusedAt: new Date()
    },
    include: {
      Skill: { select: { title: true } }
    }
  })

  // Log activity
  await logActivity(
    userId,
    "SKILL_FOCUSED",
    skillId,
    updatedFocus.Skill.title,
    { learningPlanId, currentLevel: updatedFocus.currentLevel, targetLevel: updatedFocus.targetLevel }
  ).catch(console.error)

  return { success: true }
}

// ─── Fokus entfernen ──────────────────────────────────────

export async function removeSkillFocus(
  learningPlanId: string,
  skillId: string,
  userId: string
): Promise<{ success: boolean }> {
  // Verify ownership
  const plan = await prisma.learningPlan.findUnique({
    where: { id: learningPlanId }
  })
  if (!plan || plan.userId !== userId) {
    return { success: false }
  }

  const focusItem = await prisma.learningFocus.findFirst({
    where: { learningPlanId, skillId }
  })

  if (!focusItem) return { success: false }

  await prisma.learningFocus.update({
    where: { id: focusItem.id },
    data: {
      status: "NOT_STARTED",
      focusOrder: null
    }
  })

  // Re-number remaining focused items
  const remaining = await prisma.learningFocus.findMany({
    where: { learningPlanId, status: "IN_PROGRESS" },
    orderBy: { focusOrder: "asc" }
  })

  await Promise.all(
    remaining.map((item, index) =>
      prisma.learningFocus.update({
        where: { id: item.id },
        data: { focusOrder: index + 1 }
      })
    )
  )

  return { success: true }
}

// ─── Skill als abgeschlossen markieren ────────────────────

export async function completeSkillFocus(
  learningFocusId: string,
  userId: string
): Promise<{ success: boolean }> {
  const focus = await prisma.learningFocus.findUnique({
    where: { id: learningFocusId },
    include: { LearningPlan: true }
  })

  if (!focus || focus.LearningPlan.userId !== userId) {
    return { success: false }
  }

  await prisma.learningFocus.update({
    where: { id: learningFocusId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      focusOrder: null
    }
  })

  // Re-number remaining focused items
  const remaining = await prisma.learningFocus.findMany({
    where: { learningPlanId: focus.learningPlanId, status: "IN_PROGRESS" },
    orderBy: { focusOrder: "asc" }
  })

  await Promise.all(
    remaining.map((item, index) =>
      prisma.learningFocus.update({
        where: { id: item.id },
        data: { focusOrder: index + 1 }
      })
    )
  )

  return { success: true }
}

// ─── Evidence-Note speichern ──────────────────────────────

export async function saveEvidenceNote(
  learningFocusId: string,
  content: string,
  userId: string,
  linkedResourceId?: string,
  markForAssessment: boolean = false
): Promise<{ success: boolean; noteId?: string }> {
  // Verify ownership
  const focus = await prisma.learningFocus.findUnique({
    where: { id: learningFocusId },
    include: { LearningPlan: true }
  })

  if (!focus || focus.LearningPlan.userId !== userId) {
    return { success: false }
  }

  const note = await prisma.evidenceNote.create({
    data: {
      learningFocusId,
      content,
      linkedResourceId: linkedResourceId ?? null,
      isAssessmentReady: markForAssessment
    }
  })

  return { success: true, noteId: note.id }
}

// ─── LearningPlan erstellen/aktualisieren ─────────────────

export async function generateOrRefreshLearningPlan(
  userId: string
): Promise<{ planId: string; itemCount: number }> {
  const roadmap = await getLearningRoadmap(userId)
  const allGaps = [...roadmap.critical, ...roadmap.growth, ...roadmap.stretch]

  // Upsert Plan
  const plan = await prisma.learningPlan.upsert({
    where: { userId },
    create: { userId },
    update: { updatedAt: new Date() }
  })

  // Sync items (create new gaps, preserve existing status)
  for (const gap of allGaps) {
    // Check if already exists
    const existing = await prisma.learningFocus.findFirst({
      where: { learningPlanId: plan.id, skillId: gap.skillId }
    })

    if (existing) {
      // Update levels but preserve status
      await prisma.learningFocus.update({
        where: { id: existing.id },
        data: {
          currentLevel: gap.currentLevel,
          targetLevel: gap.requiredLevel,
          gapSize: gap.gapSize,
          priority: gap.priority,
          competenceFieldId: gap.competenceFieldId
        }
      })
    } else {
      // Create new
      await prisma.learningFocus.create({
        data: {
          learningPlanId: plan.id,
          skillId: gap.skillId,
          competenceFieldId: gap.competenceFieldId,
          currentLevel: gap.currentLevel,
          targetLevel: gap.requiredLevel,
          gapSize: gap.gapSize,
          priority: gap.priority,
          status: "NOT_STARTED"
        }
      })
    }
  }

  // Remove items that are no longer gaps (optional: could also just mark as completed)
  const gapSkillIds = new Set(allGaps.map(g => g.skillId))
  const existingItems = await prisma.learningFocus.findMany({
    where: { learningPlanId: plan.id }
  })

  for (const item of existingItems) {
    if (!gapSkillIds.has(item.skillId) && item.status !== "COMPLETED") {
      // Mark as completed since gap is closed
      await prisma.learningFocus.update({
        where: { id: item.id },
        data: { status: "COMPLETED", completedAt: new Date(), focusOrder: null }
      })
    }
  }

  return { planId: plan.id, itemCount: allGaps.length }
}

// ─── LearningPlan mit Items laden ─────────────────────────

export async function getLearningPlanWithItems(userId: string) {
  const plan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      LearningFocus: {
        include: {
          Skill: true,
          CompetenceField: {
            include: {
              Owner: { select: { id: true, name: true, avatarUrl: true } }
            }
          },
          PracticalImpulse: {
            orderBy: { generatedAt: "desc" },
            take: 1
          },
          EvidenceNote: {
            orderBy: { createdAt: "desc" },
            take: 3
          }
        },
        orderBy: [{ priority: "asc" }, { gapSize: "desc" }]
      }
    }
  })

  return plan
}

// ─── STRUKTURIERTE IMPULSE ACTIONS ─────────────────────────

/**
 * Generiert einen neuen strukturierten Practical Impulse
 */
export async function generateStructuredImpulse(
  learningFocusId: string,
  userId: string
): Promise<StructuredImpulse> {
  // 1. Focus mit Skill und CompetenceField laden
  const focus = await prisma.learningFocus.findUniqueOrThrow({
    where: { id: learningFocusId },
    include: {
      Skill: true,
      CompetenceField: {
        include: {
          Owner: { select: { id: true, name: true } } // Functional Lead
        }
      },
      LearningPlan: {
        include: {
          User: true
        }
      },
      // Vorherige Impulse für Duplikatvermeidung
      PracticalImpulse: {
        orderBy: { generatedAt: "desc" },
        take: 5,
        select: { prompt: true }
      }
    }
  })

  // 2. Ownership prüfen
  if (focus.LearningPlan.userId !== userId) {
    throw new Error("Nicht autorisiert")
  }

  // 3. User's current role laden
  const userCurrentRole = focus.LearningPlan.User.currentRoleId
    ? await prisma.role.findUnique({ where: { id: focus.LearningPlan.User.currentRoleId } })
    : null

  // 4. Level-Config ermitteln
  const impulseLevel = getImpulseLevel(focus.targetLevel)
  const levelConfig = getImpulseConfig(impulseLevel)

  // 5. Kontext für die Impulse-Generierung
  const skillName = focus.Skill.title
  const competenceFieldName = focus.CompetenceField?.title ?? "Allgemein"
  const functionalLead = focus.CompetenceField?.Owner
  const userRole = userCurrentRole?.title ?? "Mitarbeiter"
  const previousPrompts = focus.PracticalImpulse.map(p => p.prompt)

  // 5. Check-In Nachricht generieren (personalisiert)
  const checkInMessage = `Ich sehe, du arbeitest an **${skillName}** für Level ${focus.targetLevel}. Das ist ein wichtiger Schritt auf deinem Entwicklungsweg bei Convidera – lass uns das gemeinsam angehen!`

  // 6. Aufgabe generieren (basierend auf Level-Didaktik)
  // In einer echten Implementierung würde hier die Claude AI aufgerufen werden
  // Für jetzt: Template-basierte Generierung
  const taskTemplates = {
    L1_AWARENESS: `Recherchiere im aktuellen Projekt oder in der Convidera-Dokumentation ein konkretes Beispiel für ${skillName}. Dokumentiere, wie es umgesetzt wurde und warum diese Lösung gewählt wurde.`,
    L2_GUIDED: `Erstelle einen ersten Entwurf für ${skillName} im Rahmen deiner aktuellen Aufgaben. Bitte danach ${functionalLead?.name ?? "deinen Functional Lead"} um Feedback zu deinem Ansatz.`,
    L3_INDEPENDENT: `Übernimm eigenverantwortlich eine Aufgabe, die ${skillName} erfordert. Dokumentiere deine Entscheidungen und Begründungen in einem kurzen Architecture Decision Record (ADR).`,
    L4_EXPERT: `Bereite eine kurze Wissenstransfer-Session (15-20 Min) über ${skillName} für dein Team vor. Fokussiere dich auf Best Practices und häufige Fallstricke.`
  }

  const taskDescription = taskTemplates[impulseLevel]

  // 7. Expected Outcome basierend auf Level
  const outcomeTemplates = {
    L1_AWARENESS: "Dokumentierte Beobachtung / Erkenntnis",
    L2_GUIDED: "Entwurf + Feedback-Dokumentation",
    L3_INDEPENDENT: "Implementierung + ADR",
    L4_EXPERT: "Präsentation / Guideline für das Team"
  }

  // 8. Impulse in DB speichern
  // Estimate minutes based on level (L1: 15min, L2: 20min, L3: 30min, L4: 45min)
  const estimatedMinutes = impulseLevel === "L1_AWARENESS" ? 15
    : impulseLevel === "L2_GUIDED" ? 20
    : impulseLevel === "L3_INDEPENDENT" ? 30
    : 45

  const impulse = await prisma.practicalImpulse.create({
    data: {
      learningFocusId,
      targetLevel: impulseLevel,
      prompt: taskDescription, // Legacy-Feld
      taskDescription,
      checkInMessage,
      expectedOutcome: outcomeTemplates[impulseLevel],
      estimatedMinutes,
      reflectionQuestion: "Was war die größte Herausforderung dabei?",
      currentStep: "CHECK_IN",
      functionalLeadId: functionalLead?.id ?? null,
      functionalLeadName: functionalLead?.name ?? null,
      isCompleted: false,
      evidenceSaved: false
    }
  })

  return {
    id: impulse.id,
    learningFocusId: impulse.learningFocusId,
    targetLevel: impulse.targetLevel,
    currentStep: impulse.currentStep,
    checkInMessage: impulse.checkInMessage,
    checkInViewedAt: impulse.checkInViewedAt,
    taskDescription: impulse.taskDescription,
    prompt: impulse.prompt,
    expectedOutcome: impulse.expectedOutcome,
    estimatedMinutes: impulse.estimatedMinutes,
    taskStartedAt: impulse.taskStartedAt,
    reflectionQuestion: impulse.reflectionQuestion,
    userReflection: impulse.userReflection,
    reflectionStartedAt: impulse.reflectionStartedAt,
    evidenceSaved: impulse.evidenceSaved,
    evidenceNoteId: impulse.evidenceNoteId,
    evidenceSavedAt: impulse.evidenceSavedAt,
    functionalLeadId: impulse.functionalLeadId,
    functionalLeadName: impulse.functionalLeadName,
    isCompleted: impulse.isCompleted,
    completedAt: impulse.completedAt,
    generatedAt: impulse.generatedAt
  }
}

/**
 * Aktualisiert den aktuellen Schritt im Impulse-Workflow
 */
export async function updateImpulseStep(
  impulseId: string,
  step: ImpulseStep,
  data?: { reflection?: string },
  userId?: string
): Promise<{ success: boolean }> {
  const updateData: Record<string, unknown> = {
    currentStep: step
  }

  // Zeitstempel für den jeweiligen Schritt setzen
  switch (step) {
    case "CHECK_IN":
      updateData.checkInViewedAt = new Date()
      break
    case "TASK":
      updateData.taskStartedAt = new Date()
      break
    case "REFLECTION":
      updateData.reflectionStartedAt = new Date()
      if (data?.reflection) {
        updateData.userReflection = data.reflection
      }
      break
    case "EVIDENCE":
      // Evidence-Schritt wird über saveImpulseEvidence abgeschlossen
      break
  }

  const impulse = await prisma.practicalImpulse.update({
    where: { id: impulseId },
    data: updateData,
    include: {
      LearningFocus: {
        include: {
          Skill: { select: { title: true } },
          LearningPlan: { select: { userId: true } },
        },
      },
    },
  })

  // Log activity when task is started
  if (step === "TASK" && impulse.LearningFocus?.LearningPlan?.userId) {
    const userIdToLog = userId || impulse.LearningFocus.LearningPlan.userId
    await logActivity(
      userIdToLog,
      "IMPULSE_STARTED",
      impulseId,
      impulse.LearningFocus.Skill?.title,
      { step: "TASK", skillId: impulse.LearningFocus.skillId }
    ).catch(console.error) // Don't fail the main action if logging fails
  }

  return { success: true }
}

/**
 * Speichert die Reflexion als Evidence-Note und verknüpft sie mit dem Impulse
 */
export async function saveImpulseEvidence(
  impulseId: string,
  reflection: string,
  userId: string
): Promise<{ success: boolean; evidenceNoteId: string }> {
  // 1. Impulse mit LearningFocus laden
  const impulse = await prisma.practicalImpulse.findUniqueOrThrow({
    where: { id: impulseId },
    include: {
      LearningFocus: {
        include: {
          LearningPlan: true,
          Skill: true
        }
      }
    }
  })

  // 2. Ownership prüfen
  if (impulse.LearningFocus.LearningPlan.userId !== userId) {
    throw new Error("Nicht autorisiert")
  }

  // 3. Evidence-Note erstellen
  const note = await prisma.evidenceNote.create({
    data: {
      learningFocusId: impulse.learningFocusId,
      content: `**Praktischer Impuls: ${impulse.LearningFocus.Skill.title}**\n\n**Aufgabe:** ${impulse.taskDescription ?? impulse.prompt}\n\n**Reflexion:** ${reflection}`,
      isAssessmentReady: true // Für Functional Lead sichtbar
    }
  })

  // 4. Impulse als abgeschlossen markieren
  await prisma.practicalImpulse.update({
    where: { id: impulseId },
    data: {
      userReflection: reflection,
      evidenceSaved: true,
      evidenceNoteId: note.id,
      evidenceSavedAt: new Date(),
      currentStep: "EVIDENCE",
      isCompleted: true,
      completedAt: new Date()
    }
  })

  // 5. Log activity for completed impulse
  const taskDescription = impulse.taskDescription ?? impulse.prompt ?? ''
  const hasAITool = /claude|copilot|gpt|ai|cursor/i.test(taskDescription)
  const hasCloudTech = /supabase|vercel|edge|serverless|cloud|aws/i.test(taskDescription)

  await logActivity(
    userId,
    "IMPULSE_COMPLETED",
    impulseId,
    impulse.LearningFocus.Skill.title,
    {
      skillId: impulse.LearningFocus.skillId,
      hasAITool,
      hasCloudTech,
      is2026Tech: hasAITool || hasCloudTech,
    }
  ).catch(console.error) // Don't fail the main action if logging fails

  return { success: true, evidenceNoteId: note.id }
}

/**
 * Lädt den aktuellen strukturierten Impulse für einen LearningFocus
 */
export async function getStructuredImpulse(
  learningFocusId: string
): Promise<StructuredImpulse | null> {
  const impulse = await prisma.practicalImpulse.findFirst({
    where: {
      learningFocusId,
      isCompleted: false
    },
    orderBy: { generatedAt: "desc" }
  })

  if (!impulse) return null

  return {
    id: impulse.id,
    learningFocusId: impulse.learningFocusId,
    targetLevel: impulse.targetLevel,
    currentStep: impulse.currentStep,
    checkInMessage: impulse.checkInMessage,
    checkInViewedAt: impulse.checkInViewedAt,
    taskDescription: impulse.taskDescription,
    prompt: impulse.prompt,
    expectedOutcome: impulse.expectedOutcome,
    estimatedMinutes: impulse.estimatedMinutes,
    taskStartedAt: impulse.taskStartedAt,
    reflectionQuestion: impulse.reflectionQuestion,
    userReflection: impulse.userReflection,
    reflectionStartedAt: impulse.reflectionStartedAt,
    evidenceSaved: impulse.evidenceSaved,
    evidenceNoteId: impulse.evidenceNoteId,
    evidenceSavedAt: impulse.evidenceSavedAt,
    functionalLeadId: impulse.functionalLeadId,
    functionalLeadName: impulse.functionalLeadName,
    isCompleted: impulse.isCompleted,
    completedAt: impulse.completedAt,
    generatedAt: impulse.generatedAt
  }
}

// ─── Learning Path Summary für Dashboard ─────────────────

export interface LearningPathSummary {
  gaps: Array<{
    skillId: string
    skillName: string
    competenceFieldName: string
    currentLevel: number
    requiredLevel: number
    gapSize: number
    priority: 'CRITICAL' | 'GROWTH' | 'STRETCH'
  }>
  focusedCount: number
  totalGaps: number
  currentRoleName: string | null
  targetRoleName: string | null
}

export async function getLearningPathSummary(userId: string): Promise<LearningPathSummary> {
  const roadmap = await getLearningRoadmap(userId)

  // Combine all gaps, sorted by priority
  const allGaps = [
    ...roadmap.critical.map(g => ({ ...g, priority: 'CRITICAL' as const })),
    ...roadmap.growth.map(g => ({ ...g, priority: 'GROWTH' as const })),
    ...roadmap.stretch.map(g => ({ ...g, priority: 'STRETCH' as const })),
  ]

  // Get focused count from learning plan
  const plan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      LearningFocus: {
        where: { status: 'IN_PROGRESS' }
      }
    }
  })

  return {
    gaps: allGaps.map(g => ({
      skillId: g.skillId,
      skillName: g.skillName,
      competenceFieldName: g.competenceFieldName,
      currentLevel: g.currentLevel,
      requiredLevel: g.requiredLevel,
      gapSize: g.gapSize,
      priority: g.priority,
    })),
    focusedCount: plan?.LearningFocus.length ?? 0,
    totalGaps: roadmap.meta.totalGaps,
    currentRoleName: roadmap.meta.currentRoleName,
    targetRoleName: roadmap.meta.targetRoleName,
  }
}

// ─── Dashboard Data Loading ─────────────────────────────────

export interface DashboardLearningData {
  inProgressSkills: Array<{
    skillId: string
    skillName: string
    competenceFieldName: string | null
    currentLevel: number
    targetLevel: number
    learningFocusId: string
  }>
  activeImpulse: StructuredImpulse | null
  completedImpulsesCount: number
  recentCompletedImpulses: Array<{
    id: string
    skillName: string
    completedAt: Date | null
    userReflection: string | null
  }>
  planId: string | null
}

export async function getDashboardLearningData(
  userId: string
): Promise<DashboardLearningData> {
  // Fetch learning plan with IN_PROGRESS focuses
  const plan = await prisma.learningPlan.findUnique({
    where: { userId },
    include: {
      LearningFocus: {
        where: { status: 'IN_PROGRESS' },
        include: {
          Skill: { select: { title: true } },
          CompetenceField: { select: { title: true } },
          PracticalImpulse: {
            where: { isCompleted: false },
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { focusOrder: 'asc' },
        take: 3, // Max 3 focused skills
      },
    },
  })

  // Count completed impulses and get recent ones
  const [completedCount, recentCompleted] = await Promise.all([
    plan
      ? prisma.practicalImpulse.count({
          where: {
            LearningFocus: { learningPlanId: plan.id },
            isCompleted: true,
          },
        })
      : 0,
    plan
      ? prisma.practicalImpulse.findMany({
          where: {
            LearningFocus: { learningPlanId: plan.id },
            isCompleted: true,
          },
          include: {
            LearningFocus: {
              include: { Skill: { select: { title: true } } },
            },
          },
          orderBy: { completedAt: 'desc' },
          take: 5,
        })
      : [],
  ])

  const inProgressSkills = plan?.LearningFocus.map((f) => ({
    skillId: f.skillId,
    skillName: f.Skill.title,
    competenceFieldName: f.CompetenceField?.title ?? null,
    currentLevel: f.currentLevel,
    targetLevel: f.targetLevel,
    learningFocusId: f.id,
  })) ?? []

  const activeImpulseRaw = plan?.LearningFocus[0]?.PracticalImpulse[0]
  const activeImpulse: StructuredImpulse | null = activeImpulseRaw
    ? {
        id: activeImpulseRaw.id,
        learningFocusId: activeImpulseRaw.learningFocusId,
        targetLevel: activeImpulseRaw.targetLevel,
        currentStep: activeImpulseRaw.currentStep,
        checkInMessage: activeImpulseRaw.checkInMessage,
        checkInViewedAt: activeImpulseRaw.checkInViewedAt,
        taskDescription: activeImpulseRaw.taskDescription,
        prompt: activeImpulseRaw.prompt,
        expectedOutcome: activeImpulseRaw.expectedOutcome,
        estimatedMinutes: activeImpulseRaw.estimatedMinutes,
        taskStartedAt: activeImpulseRaw.taskStartedAt,
        reflectionQuestion: activeImpulseRaw.reflectionQuestion,
        userReflection: activeImpulseRaw.userReflection,
        reflectionStartedAt: activeImpulseRaw.reflectionStartedAt,
        evidenceSaved: activeImpulseRaw.evidenceSaved,
        evidenceNoteId: activeImpulseRaw.evidenceNoteId,
        evidenceSavedAt: activeImpulseRaw.evidenceSavedAt,
        functionalLeadId: activeImpulseRaw.functionalLeadId,
        functionalLeadName: activeImpulseRaw.functionalLeadName,
        isCompleted: activeImpulseRaw.isCompleted,
        completedAt: activeImpulseRaw.completedAt,
        generatedAt: activeImpulseRaw.generatedAt,
      }
    : null

  return {
    inProgressSkills,
    activeImpulse,
    completedImpulsesCount: completedCount,
    recentCompletedImpulses: recentCompleted.map((i) => ({
      id: i.id,
      skillName: i.LearningFocus.Skill.title,
      completedAt: i.completedAt,
      userReflection: i.userReflection,
    })),
    planId: plan?.id ?? null,
  }
}

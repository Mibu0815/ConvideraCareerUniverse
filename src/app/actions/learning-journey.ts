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

  // Detect if this is a soft skill
  const isSoftSkill = /stakeholder|kommunikation|feedback|präsentation|moderation|coaching|leadership|team|konflikt|verhandlung|empathie|negotiation|facilitation/i.test(skillName)

  // 5. Generate impulse with Glashaus-Prinzip (three-step model)
  let checkInMessage: string
  let taskDescription: string
  let vorbereitungText: string
  let durchfuehrungText: string
  let ergebnisCheckText: string
  let expectedOutcome: string
  let reflectionQuestion: string
  let supportConcept: string
  let supportExplanation: string
  let supportTemplate: string

  if (isSoftSkill) {
    // Soft Skill: Social interaction framing (Coaching-Style)
    checkInMessage = `Hey! Heute geht es um **${skillName}** – ein Skill, der in Zeiten von KI noch wichtiger wird. Warum? Während KI immer mehr technische Aufgaben übernimmt, bleibt die menschliche Verbindung dein Alleinstellungsmerkmal. Lass uns das gemeinsam üben!`

    taskDescription = `Führe ein kurzes "Pulse-Check" Gespräch mit einem Stakeholder oder Teammitglied durch.`

    vorbereitungText = `**Was ist ein Pulse-Check?** – Ein kurzes, informelles Gespräch (5-10 Min), um frühzeitig Stimmungen und Bedenken wahrzunehmen.

1. Wähle eine Person aus deinem aktuellen Projekt, mit der du diese Woche noch nicht gesprochen hast
2. Überlege dir einen konkreten Anknüpfungspunkt (z.B. ein Modul, ein Meeting, eine Deadline)`

    durchfuehrungText = `1. Sprich die Person kurz an (persönlich, Teams oder Slack)
2. Nutze einen lockeren Einstieg: "Hey, kurze Frage zu [Thema]..."
3. Stelle eine offene Frage: "Wo siehst du aktuell die größte Hürde für uns?"
4. Höre aktiv zu – keine Lösungen anbieten, nur verstehen
5. Bedanke dich für die Offenheit`

    ergebnisCheckText = `✓ Du hast mindestens eine neue Information erhalten
✓ Die Person fühlte sich gehört (nicht "abgefertigt")
✓ Du hast keine Versprechungen gemacht, die du nicht halten kannst`

    expectedOutcome = `Ein kurzes Gespräch mit einer dokumentierten Erkenntnis`

    reflectionQuestion = `Was hat dich überrascht? Gab es etwas, das du ohne dieses Gespräch nicht erfahren hättest?`

    supportConcept = `Pulse-Check`
    supportExplanation = `Ein Pulse-Check ist ein kurzes, informelles Gespräch, um frühzeitig Stimmungen, Bedenken oder Blocker wahrzunehmen – bevor sie zu echten Problemen werden.`
    supportTemplate = `## Gesprächsleitfaden: Pulse-Check

**Einstieg:**
"Hey [Name], hast du kurz 5 Minuten? Ich wollte mal kurz zu [Thema/Projekt] nachhaken."

**Kernfrage:**
"Wie läuft es aus deiner Sicht? Wo siehst du aktuell die größte Hürde?"

**Follow-up:**
"Gibt es etwas, das ich tun kann, um dir zu helfen?"

**Abschluss:**
"Danke für deine Offenheit! Ich melde mich, wenn ich etwas herausfinde."

---
📝 **Notizen:**
- Person:
- Thema:
- Wichtigste Erkenntnis:
- Mögliche Aktion:`
  } else {
    // Technical Skill: Step-by-step with term explanations
    checkInMessage = `Hey! Heute arbeiten wir an **${skillName}** für Level ${focus.targetLevel}. Ich habe eine praktische Übung vorbereitet, die du mit KI-Unterstützung in 15-20 Minuten umsetzen kannst. Kein Vorwissen nötig – ich erkläre alles!`

    const techTaskTemplates: Record<ImpulseLevel, { task: string; vorbereitung: string; durchfuehrung: string; check: string; outcome: string; concept: string; explanation: string; template: string }> = {
      L1_AWARENESS: {
        task: `Recherchiere ein konkretes Beispiel für "${skillName}" mit KI-Unterstützung.`,
        vorbereitung: `**Was brauchst du?**
- Zugang zu Claude, ChatGPT oder einem ähnlichen KI-Tool
- Optional: Ein aktuelles Projekt als Kontext

**Begriffserklärung:**
- **Prompt** – Die Anweisung/Frage, die du der KI gibst
- **Best Practice** – Eine bewährte Vorgehensweise, die sich in der Praxis etabliert hat`,
        durchfuehrung: `1. Öffne dein KI-Tool (Claude, ChatGPT, etc.)
2. Frage: "Erkläre mir ${skillName} anhand eines einfachen Beispiels aus der Beratung"
3. Bitte um ein zweites Beispiel zur Vertiefung
4. Notiere die wichtigsten Erkenntnisse`,
        check: `✓ Du kannst ${skillName} in einem Satz erklären
✓ Du hast mindestens ein konkretes Beispiel verstanden
✓ Du könntest einem Kollegen davon erzählen`,
        outcome: "Dokumentierte Recherche mit 2-3 Kernerkenntnissen",
        concept: "KI-gestützte Recherche",
        explanation: "KI-Tools wie Claude können komplexe Themen anhand von Beispielen erklären. Der Trick ist, konkrete Fragen zu stellen und bei Unklarheiten nachzuhaken.",
        template: `## Meine Recherche zu ${skillName}

**Frage 1:**
[Was habe ich gefragt?]

**Antwort (Zusammenfassung):**
[Wichtigste Punkte]

**Beispiel aus der Praxis:**
[Konkretes Beispiel]

**Mein Fazit:**
[Was nehme ich mit?]`
      },
      L2_GUIDED: {
        task: `Erstelle einen ersten Entwurf für "${skillName}" und hole dir Feedback.`,
        vorbereitung: `**Was ist ${skillName}?** – ${skillName} ist ein wichtiger Bestandteil professioneller Arbeit bei Convidera.

**Wen fragen?**
- ${functionalLead?.name ?? "Deinen Functional Lead"} oder einen erfahrenen Kollegen

**Begriffserklärung:**
- **Entwurf** – Eine erste Version, die nicht perfekt sein muss
- **Feedback** – Konstruktive Rückmeldung zur Verbesserung`,
        durchfuehrung: `1. Erstelle einen ersten, einfachen Entwurf (15-20 Min)
2. Schreibe 2-3 konkrete Fragen auf, zu denen du Feedback möchtest
3. Bitte um einen kurzen Termin (10 Min) für Feedback
4. Notiere die wichtigsten Verbesserungsvorschläge`,
        check: `✓ Du hast einen Entwurf erstellt (auch wenn unvollständig)
✓ Du hast mindestens 2 konkrete Feedback-Punkte erhalten
✓ Du weißt, was du als nächstes verbessern würdest`,
        outcome: "Entwurf mit dokumentiertem Feedback",
        concept: "Feedback-Schleife",
        explanation: "Eine Feedback-Schleife bedeutet: Erst machen, dann Rückmeldung holen, dann verbessern. Es ist völlig normal (und erwünscht!), dass der erste Entwurf noch nicht perfekt ist.",
        template: `## Mein Entwurf für ${skillName}

**Was ich gemacht habe:**
[Kurze Beschreibung]

**Meine Fragen fürs Feedback:**
1. [Frage 1]
2. [Frage 2]
3. [Frage 3]

**Erhaltenes Feedback:**
- [Punkt 1]
- [Punkt 2]

**Nächste Schritte:**
[Was verbessere ich?]`
      },
      L3_INDEPENDENT: {
        task: `Übernimm eigenverantwortlich eine Aufgabe zu "${skillName}" und dokumentiere deine Entscheidungen.`,
        vorbereitung: `**Was ist ein ADR?** – Ein **Architecture Decision Record** ist eine kurze Notiz, die erklärt WARUM du eine bestimmte Entscheidung getroffen hast. Nicht perfekt formuliert, aber nachvollziehbar.

**Begriffserklärung:**
- **Trade-off** – Wenn du dich FÜR etwas entscheidest, verzichtest du auf etwas anderes
- **Kontext** – Die Umstände, unter denen die Entscheidung getroffen wurde`,
        durchfuehrung: `1. Identifiziere eine anstehende Aufgabe, die ${skillName} erfordert
2. Führe sie eigenständig durch
3. Erstelle einen kurzen ADR: Was? Warum? Welche Alternativen gab es?
4. Optional: Teile den ADR mit deinem Team`,
        check: `✓ Die Aufgabe ist abgeschlossen
✓ Der ADR ist verständlich (auch für jemanden, der nicht dabei war)
✓ Du hast mindestens eine Alternative dokumentiert`,
        outcome: "Abgeschlossene Aufgabe + ADR-Dokumentation",
        concept: "ADR (Architecture Decision Record)",
        explanation: "Ein ADR ist ein kurzes Dokument, das erklärt: 1) Was wurde entschieden? 2) Warum? 3) Welche Alternativen gab es? Es hilft dem Team (und dir selbst), später nachzuvollziehen, warum etwas so gemacht wurde.",
        template: `## ADR: [Entscheidungstitel]

**Datum:** [Heute]
**Status:** Akzeptiert

### Kontext
[Was ist die Ausgangssituation?]

### Entscheidung
[Was habe ich entschieden?]

### Begründung
[Warum diese Lösung?]

### Alternativen
1. [Alternative A] – nicht gewählt weil...
2. [Alternative B] – nicht gewählt weil...

### Konsequenzen
[Was bedeutet diese Entscheidung für die Zukunft?]`
      },
      L4_EXPERT: {
        task: `Bereite eine kurze Wissenstransfer-Session (15-20 Min) über "${skillName}" vor.`,
        vorbereitung: `**Was ist Wissenstransfer?** – Das gezielte Teilen von Know-how mit Kollegen, damit sie von deiner Erfahrung profitieren.

**Begriffserklärung:**
- **Best Practice** – Bewährte Vorgehensweisen aus der Praxis
- **Anti-Pattern** – Häufige Fehler, die man vermeiden sollte`,
        durchfuehrung: `1. Wähle 3-5 Kernpunkte aus, die du vermitteln möchtest
2. Bereite mindestens ein konkretes Beispiel vor
3. Überlege dir 1-2 häufige Fehler (Anti-Patterns)
4. Halte die Session oder erstelle eine kurze Guideline`,
        check: `✓ Die Inhalte sind praxisnah (nicht nur Theorie)
✓ Mindestens ein konkretes Beispiel ist enthalten
✓ Ein Kollege hat etwas Neues gelernt`,
        outcome: "Durchgeführte Session oder dokumentierte Guideline",
        concept: "Wissenstransfer",
        explanation: "Wissenstransfer bedeutet, dein Know-how so aufzubereiten, dass andere davon profitieren. Der Schlüssel: Konkrete Beispiele und typische Fallstricke teilen – nicht nur abstrakte Theorie.",
        template: `## Wissenstransfer: ${skillName}

### Die 3 wichtigsten Punkte
1. [Kernpunkt 1]
2. [Kernpunkt 2]
3. [Kernpunkt 3]

### Praxisbeispiel
[Konkretes Beispiel aus einem Projekt]

### Häufige Fehler (Anti-Patterns)
1. ❌ [Fehler] → ✅ [Besser so]
2. ❌ [Fehler] → ✅ [Besser so]

### Weiterführende Ressourcen
- [Link/Ressource 1]
- [Link/Ressource 2]`
      }
    }

    const template = techTaskTemplates[impulseLevel]
    taskDescription = template.task
    vorbereitungText = template.vorbereitung
    durchfuehrungText = template.durchfuehrung
    ergebnisCheckText = template.check
    expectedOutcome = template.outcome
    reflectionQuestion = "Was war überraschend oder schwieriger als gedacht?"
    supportConcept = template.concept
    supportExplanation = template.explanation
    supportTemplate = template.template
  }

  // 6. Impulse in DB speichern
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
      expectedOutcome,
      estimatedMinutes,
      reflectionQuestion,
      // Three-step model (Glashaus-Prinzip)
      vorbereitungText,
      durchfuehrungText,
      ergebnisCheckText,
      // Interactive Scaffolding
      supportConcept,
      supportExplanation,
      supportTemplate,
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
    taskPrompt: impulse.prompt,
    taskDescription: impulse.taskDescription,
    expectedOutcome: impulse.expectedOutcome,
    estimatedMinutes: impulse.estimatedMinutes,
    reflectionPrompt: impulse.reflectionQuestion,
    reflectionQuestion: impulse.reflectionQuestion,
    userReflection: impulse.userReflection,
    isCompleted: impulse.isCompleted,
    completedAt: impulse.completedAt,
    generatedAt: impulse.generatedAt,
    evidenceSaved: impulse.evidenceSaved,
    // Three-step model
    vorbereitungText: impulse.vorbereitungText,
    durchfuehrungText: impulse.durchfuehrungText,
    ergebnisCheckText: impulse.ergebnisCheckText,
    // Scaffolding
    supportConcept: impulse.supportConcept,
    supportExplanation: impulse.supportExplanation,
    supportTemplate: impulse.supportTemplate,
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
    taskPrompt: impulse.prompt,
    taskDescription: impulse.taskDescription,
    expectedOutcome: impulse.expectedOutcome,
    estimatedMinutes: impulse.estimatedMinutes,
    reflectionPrompt: impulse.reflectionQuestion,
    reflectionQuestion: impulse.reflectionQuestion,
    userReflection: impulse.userReflection,
    isCompleted: impulse.isCompleted,
    completedAt: impulse.completedAt,
    generatedAt: impulse.generatedAt,
    evidenceSaved: impulse.evidenceSaved,
    // Three-step model
    vorbereitungText: impulse.vorbereitungText,
    durchfuehrungText: impulse.durchfuehrungText,
    ergebnisCheckText: impulse.ergebnisCheckText,
    // Scaffolding
    supportConcept: impulse.supportConcept,
    supportExplanation: impulse.supportExplanation,
    supportTemplate: impulse.supportTemplate,
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
        taskPrompt: activeImpulseRaw.prompt,
        taskDescription: activeImpulseRaw.taskDescription,
        expectedOutcome: activeImpulseRaw.expectedOutcome,
        estimatedMinutes: activeImpulseRaw.estimatedMinutes,
        reflectionPrompt: activeImpulseRaw.reflectionQuestion,
        reflectionQuestion: activeImpulseRaw.reflectionQuestion,
        userReflection: activeImpulseRaw.userReflection,
        isCompleted: activeImpulseRaw.isCompleted,
        completedAt: activeImpulseRaw.completedAt,
        generatedAt: activeImpulseRaw.generatedAt,
        evidenceSaved: activeImpulseRaw.evidenceSaved,
        // Three-step model
        vorbereitungText: activeImpulseRaw.vorbereitungText,
        durchfuehrungText: activeImpulseRaw.durchfuehrungText,
        ergebnisCheckText: activeImpulseRaw.ergebnisCheckText,
        // Scaffolding
        supportConcept: activeImpulseRaw.supportConcept,
        supportExplanation: activeImpulseRaw.supportExplanation,
        supportTemplate: activeImpulseRaw.supportTemplate,
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

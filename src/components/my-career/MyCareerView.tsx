"use client"

import { useMemo, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { PlatformRole } from "@prisma/client"
import { Navigation } from "@/components/shared"
import { CareerRadarChart } from "@/app/my-career/compare/components/CareerRadarChart"
import {
  Target,
  ChevronRight,
  ArrowRight,
  Trophy,
  TrendingUp,
  Zap,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  Star,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────

interface RoleInfo {
  id: string
  title: string
  level: string
}

interface GoalData {
  id: string
  roleTitle: string
  roleLevel: string
  status: string
  notes: string | null
}

interface SkillData {
  id: string
  name: string
  selfLevel: number
  validatedLevel: number | null
  evidenceCount: number
  requiredLevel: number | null
}

interface SkillFieldGroup {
  fieldName: string
  skills: SkillData[]
}

interface ActivityData {
  id: string
  action: string
  details: string | null
  createdAt: string
}

interface MyCareerViewProps {
  userName: string | null
  userEmail: string
  memberSince: string
  currentRole: RoleInfo | null
  targetRole: RoleInfo | null
  progressPercent: number
  totalGaps: number
  completedSkillsCount: number
  criticalGaps: number
  growthGaps: number
  stretchGaps: number
  goals: GoalData[]
  skillsByField: SkillFieldGroup[]
  recentActivity: ActivityData[]
  platformRole?: PlatformRole
  validationBadge?: ReactNode
}

// ─── Design Tokens ───────────────────────────────────────

const C = {
  blue: "#0055FF",
  dark: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#E2E8F0",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
}

const levelColors: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" },
  1: { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  2: { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  3: { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  4: { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
}

const levelLabels: Record<number, string> = {
  0: "Keine",
  1: "Learner",
  2: "Practitioner",
  3: "Expert",
  4: "Master",
}

// ─── Helpers ─────────────────────────────────────────────

function formatLevel(level: string): string {
  const map: Record<string, string> = {
    JUNIOR: "Junior",
    PROFESSIONAL: "Professional",
    SENIOR: "Senior",
    FUNCTIONAL_LEAD: "Functional Lead",
    HEAD_OF: "Head of",
  }
  return map[level] ?? level
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    IMPULSE_STARTED: "Impuls gestartet",
    IMPULSE_COMPLETED: "Impuls abgeschlossen",
    SKILL_FOCUSED: "Skill fokussiert",
    SKILL_UNFOCUSED: "Skill-Fokus entfernt",
    EVIDENCE_SUBMITTED: "Nachweis eingereicht",
    ROLE_CHANGED: "Rolle geändert",
    GOAL_CREATED: "Karriereziel gesetzt",
    GOAL_UPDATED: "Karriereziel aktualisiert",
    REFLECTION_SAVED: "Reflexion gespeichert",
  }
  return map[action] ?? action
}

function getActionIcon(action: string) {
  switch (action) {
    case "IMPULSE_STARTED": return <Zap size={14} className="text-amber-500" />
    case "IMPULSE_COMPLETED": return <CheckCircle2 size={14} className="text-green-500" />
    case "SKILL_FOCUSED": return <Target size={14} className="text-blue-500" />
    case "EVIDENCE_SUBMITTED": return <FileText size={14} className="text-purple-500" />
    case "GOAL_CREATED": return <Star size={14} className="text-amber-500" />
    default: return <Clock size={14} className="text-gray-400" />
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return "gerade eben"
  if (diffMin < 60) return `vor ${diffMin} Min.`
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "short" })
}

function getGoalStatusInfo(status: string) {
  switch (status) {
    case "EXPLORING":
      return { label: "Erkunden", color: C.blue, bg: "bg-blue-50", text: "text-blue-700" }
    case "COMMITTED":
      return { label: "Aktiv", color: C.green, bg: "bg-green-50", text: "text-green-700" }
    case "ACHIEVED":
      return { label: "Erreicht", color: C.purple, bg: "bg-purple-50", text: "text-purple-700" }
    case "ABANDONED":
      return { label: "Pausiert", color: C.textFaint, bg: "bg-gray-50", text: "text-gray-500" }
    default:
      return { label: status, color: C.textMuted, bg: "bg-gray-50", text: "text-gray-500" }
  }
}

// ─── Component ───────────────────────────────────────────

export function MyCareerView({
  userName,
  userEmail,
  memberSince,
  currentRole,
  targetRole,
  progressPercent,
  totalGaps,
  completedSkillsCount,
  criticalGaps,
  growthGaps,
  stretchGaps,
  goals,
  skillsByField,
  recentActivity,
  platformRole,
  validationBadge,
}: MyCareerViewProps) {
  const router = useRouter()
  const activeGoals = goals.filter((g) => g.status === "EXPLORING" || g.status === "COMMITTED")
  const achievedGoals = goals.filter((g) => g.status === "ACHIEVED")
  const memberDate = new Date(memberSince)

  const radarData = useMemo(() => {
    return skillsByField.map((group) => {
      const current = group.skills.reduce((max, s) => {
        const lvl = s.validatedLevel ?? s.selfLevel
        return lvl > max ? lvl : max
      }, 0)
      const target = group.skills.reduce((max, s) => {
        const lvl = s.requiredLevel ?? 0
        return lvl > max ? lvl : max
      }, current)
      return { subject: group.fieldName, current, target, fullMark: 4 }
    })
  }, [skillsByField])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        userName={userName}
        platformRole={platformRole}
        validationBadge={validationBadge}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Mein Karriereprofil
          </h1>
          <p className="text-sm text-gray-500">
            {userName ?? userEmail} &middot; Mitglied seit{" "}
            {memberDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ── Skill Balance Radar ── */}
        {radarData.length >= 3 && (
          <section className="mb-8">
            <CareerRadarChart
              data={radarData}
              currentRoleName={currentRole?.title ?? "Heute"}
              targetRoleName={targetRole?.title ?? "Ziel"}
            />
          </section>
        )}

        {/* ── Career Snapshot ── */}
        <section className="mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Role Path */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Karrierepfad</h2>
                  <p className="text-xs text-gray-500">Dein Weg zur Zielrolle</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Aktuelle Rolle
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {currentRole?.title ?? "Nicht festgelegt"}
                  </div>
                  {currentRole && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatLevel(currentRole.level)}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-convidera-blue/10 flex items-center justify-center">
                  <ChevronRight size={16} className="text-convidera-blue" />
                </div>

                <div className="flex-1 bg-blue-50/50 rounded-xl px-4 py-3 border border-blue-100/60">
                  <div className="text-[10px] font-semibold text-convidera-blue/60 uppercase tracking-wider mb-1">
                    Zielrolle
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {targetRole?.title ?? "Nicht festgelegt"}
                  </div>
                  {targetRole && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatLevel(targetRole.level)}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {targetRole && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">
                      Fortschritt zur Zielrolle
                    </span>
                    <span className="text-xs font-bold text-convidera-blue">
                      {progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-convidera-blue to-blue-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(progressPercent, 2)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-gray-400">
                      {completedSkillsCount} von {totalGaps} Skills abgeschlossen
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Gap Stats */}
            {totalGaps > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <AlertTriangle size={12} className="text-red-500" />
                    <span className="text-xs font-semibold text-gray-500">Kritisch</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{criticalGaps}</span>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-amber-500" />
                    <span className="text-xs font-semibold text-gray-500">Wachstum</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{growthGaps}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Sparkles size={12} className="text-purple-500" />
                    <span className="text-xs font-semibold text-gray-500">Stretch</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{stretchGaps}</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => router.push("/my-career/compare")}
                className="text-xs font-medium text-convidera-blue hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                Rollen vergleichen <ArrowRight size={12} />
              </button>
              {!currentRole && (
                <button
                  onClick={() => router.push("/my-career/compare")}
                  className="px-4 py-2 bg-convidera-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Rolle festlegen
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Two Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* ── Skill Portfolio (3/5) ── */}
          <section className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Award size={16} className="text-convidera-blue" />
                  </div>
                  <h2 className="text-base font-semibold text-gray-900">Skill-Portfolio</h2>
                </div>
                <span className="text-xs text-gray-400">
                  {skillsByField.reduce((acc, f) => acc + f.skills.length, 0)} Skills
                </span>
              </div>

              {skillsByField.length === 0 ? (
                <div className="px-5 pb-5 text-center py-8">
                  <p className="text-sm text-gray-400 mb-3">Noch keine Skills bewertet.</p>
                  <button
                    onClick={() => router.push("/my-career/compare")}
                    className="text-xs font-medium text-convidera-blue hover:text-blue-700"
                  >
                    Starte mit der Rollenauswahl
                  </button>
                </div>
              ) : (
                <div className="px-5 pb-5 space-y-4 max-h-[520px] overflow-y-auto">
                  {skillsByField.map((group) => (
                    <div key={group.fieldName}>
                      <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                        {group.fieldName}
                      </h3>
                      <div className="space-y-1.5">
                        {group.skills.map((skill) => {
                          const level = skill.validatedLevel ?? skill.selfLevel
                          const lc = levelColors[level] ?? levelColors[0]
                          const gap = skill.requiredLevel !== null ? skill.requiredLevel - level : null

                          return (
                            <div
                              key={skill.id}
                              className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {skill.name}
                                  </span>
                                  {skill.evidenceCount > 0 && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                                      <FileText size={10} />
                                      {skill.evidenceCount}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Level badge */}
                              <span
                                className="text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                                style={{
                                  backgroundColor: lc.bg,
                                  color: lc.text,
                                  border: `1px solid ${lc.border}`,
                                }}
                              >
                                L{level} {levelLabels[level]}
                              </span>

                              {/* Gap indicator */}
                              {gap !== null && gap > 0 && (
                                <span className="text-[10px] font-medium text-red-500 flex-shrink-0">
                                  -{gap}
                                </span>
                              )}
                              {gap !== null && gap <= 0 && (
                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── Right Column (2/5) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Goals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 pb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Trophy size={16} className="text-amber-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Karriereziele</h2>
              </div>

              <div className="px-5 pb-5">
                {goals.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-2">Noch keine Ziele definiert.</p>
                    <button
                      onClick={() => router.push("/my-career/compare")}
                      className="text-xs font-medium text-convidera-blue hover:text-blue-700"
                    >
                      Zielrolle entdecken
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Active goals */}
                    {activeGoals.map((goal) => {
                      const statusInfo = getGoalStatusInfo(goal.status)
                      return (
                        <div
                          key={goal.id}
                          className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {goal.roleTitle}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatLevel(goal.roleLevel)}
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {goal.notes && (
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                              {goal.notes}
                            </p>
                          )}
                        </div>
                      )
                    })}

                    {/* Achieved goals */}
                    {achievedGoals.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Erreicht
                        </div>
                        {achievedGoals.map((goal) => (
                          <div
                            key={goal.id}
                            className="flex items-center gap-2 py-1.5 text-sm text-gray-500"
                          >
                            <CheckCircle2 size={14} className="text-green-500" />
                            <span>{goal.roleTitle}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 pb-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Clock size={16} className="text-green-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Letzte Aktivitäten</h2>
              </div>

              <div className="px-5 pb-5">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">Noch keine Aktivitäten.</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getActionIcon(activity.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700">
                            {formatAction(activity.action)}
                          </div>
                          {activity.details && (
                            <p className="text-xs text-gray-400 truncate">
                              {activity.details}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">
                          {timeAgo(activity.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => router.push("/my-career/compare")}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Rollen vergleichen</div>
                <div className="text-xs text-gray-500">Skills & Verantwortungen</div>
              </div>
            </button>

            <button
              onClick={() => router.push("/learning-journey")}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-convidera-blue flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Lernreise starten</div>
                <div className="text-xs text-gray-500">Praktische Impulse & Evidenz</div>
              </div>
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Dashboard</div>
                <div className="text-xs text-gray-500">Übersicht & Statistiken</div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

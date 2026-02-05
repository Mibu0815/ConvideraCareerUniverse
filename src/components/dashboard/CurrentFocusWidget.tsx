// src/components/dashboard/CurrentFocusWidget.tsx
"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  Target,
  CheckCircle2,
  Clock,
  Play,
  Zap,
} from "lucide-react"
import type { StructuredImpulse } from "@/types/practical-impulse"

interface InProgressSkill {
  skillId: string
  skillName: string
  competenceFieldName: string | null
  currentLevel: number
  targetLevel: number
  learningFocusId: string
}

interface Props {
  inProgressSkills: InProgressSkill[]
  activeImpulse: StructuredImpulse | null
  completedImpulsesCount: number
  style?: React.CSSProperties
  animStyle?: React.CSSProperties
}

// Design tokens
const C = {
  blue: "#0055FF",
  blueGlow: "rgba(0,85,255,0.4)",
  dark: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#E2E8F0",
  white70: "rgba(255,255,255,0.7)",
  white20: "rgba(255,255,255,0.2)",
}

const glass: React.CSSProperties = {
  background: C.white70,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${C.white20}`,
  borderRadius: "22px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1.5px 6px rgba(0,0,0,0.03)",
}

export function CurrentFocusWidget({
  inProgressSkills,
  activeImpulse,
  completedImpulsesCount,
  style,
  animStyle,
}: Props) {
  const router = useRouter()
  const currentSkill = inProgressSkills[0]

  // Determine the current step label
  const getStepInfo = () => {
    if (!activeImpulse) return null
    switch (activeImpulse.currentStep) {
      case "CHECK_IN":
        return { label: "Check-In", icon: Play, color: "#3B82F6" }
      case "TASK":
        return { label: "Aufgabe", icon: Clock, color: "#F59E0B" }
      case "REFLECTION":
        return { label: "Reflexion", icon: Target, color: "#8B5CF6" }
      default:
        return { label: "Evidence", icon: CheckCircle2, color: "#10B981" }
    }
  }

  const stepInfo = getStepInfo()

  // Calculate progress percentage for the impulse
  const getProgressPercent = () => {
    if (!activeImpulse) return 0
    switch (activeImpulse.currentStep) {
      case "CHECK_IN":
        return 25
      case "TASK":
        return 50
      case "REFLECTION":
        return 75
      default:
        return 100
    }
  }

  // No active skills - show empty state
  if (!currentSkill) {
    return (
      <div
        className="gc"
        onClick={() => router.push("/my-career/compare")}
        style={{
          ...glass,
          ...style,
          ...animStyle,
          padding: "28px",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: C.blue,
            color: "#fff",
            fontSize: "9.5px",
            fontWeight: 700,
            padding: "3.5px 10px",
            borderRadius: "7px",
            letterSpacing: ".9px",
          }}
        >
          START
        </span>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: C.dark,
            lineHeight: 1.3,
            marginBottom: "10px",
            paddingRight: "54px",
          }}
        >
          Starte deine Lernreise
        </h3>
        <p
          style={{
            fontSize: "12.5px",
            color: C.textFaint,
            lineHeight: 1.65,
            marginBottom: "24px",
          }}
        >
          Wähle Skills aus, die du verbessern möchtest. Der AI Mentor erstellt
          dann praktische Impulse für dich.
        </p>
        <div
          style={{
            background: C.blue,
            color: "#fff",
            padding: "10px 22px",
            borderRadius: "12px",
            fontSize: "13px",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            alignSelf: "flex-start",
          }}
        >
          Skills auswählen <ArrowRight size={14} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="gc"
      style={{
        ...glass,
        ...style,
        ...animStyle,
        padding: "0",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onClick={() => router.push("/learning-journey")}
    >
      {/* Header with gradient */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark} 0%, #1a1a2e 100%)`,
          padding: "20px 24px",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Dein aktueller Fokus
            </div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1.3,
              }}
            >
              {currentSkill.skillName}
            </h3>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,255,255,0.1)",
              padding: "6px 12px",
              borderRadius: "20px",
            }}
          >
            <Target size={14} color="#60A5FA" />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#60A5FA" }}>
              L{currentSkill.currentLevel} → L{currentSkill.targetLevel}
            </span>
          </div>
        </div>

        {/* Active impulse status */}
        {activeImpulse && stepInfo && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              padding: "10px 14px",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: `${stepInfo.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <stepInfo.icon size={16} color={stepInfo.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "4px",
                }}
              >
                Impuls aktiv: {stepInfo.label}
              </div>
              <div
                style={{
                  height: "4px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercent()}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: "100%",
                    background: stepInfo.color,
                    borderRadius: "2px",
                  }}
                />
              </div>
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: stepInfo.color,
              }}
            >
              {getProgressPercent()}%
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            marginBottom: "20px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: C.blue,
                letterSpacing: ".8px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Fokus-Skills
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: C.dark,
                lineHeight: 1,
                letterSpacing: "-1px",
              }}
            >
              {inProgressSkills.length}
              <span style={{ fontSize: "14px", color: C.textFaint, fontWeight: 500 }}>
                /3
              </span>
            </div>
          </div>
          <div
            style={{
              width: "1px",
              background: C.border,
              alignSelf: "stretch",
              margin: "4px 0",
            }}
          />
          <div>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "#10B981",
                letterSpacing: ".8px",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              Impulse
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: C.dark,
                lineHeight: 1,
                letterSpacing: "-1px",
              }}
            >
              {completedImpulsesCount}
              <span
                style={{ fontSize: "12px", color: C.textFaint, fontWeight: 500, marginLeft: "4px" }}
              >
                erledigt
              </span>
            </div>
          </div>
        </div>

        {/* Other active skills */}
        {inProgressSkills.length > 1 && (
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: C.textFaint,
                letterSpacing: ".8px",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Weitere Fokus-Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {inProgressSkills.slice(1).map((skill) => (
                <span
                  key={skill.skillId}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: C.textMuted,
                    background: "rgba(0,85,255,0.06)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  {skill.skillName}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            router.push("/learning-journey")
          }}
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${C.blue}, #0044DD)`,
            color: "#fff",
            border: "none",
            padding: "14px 24px",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: `0 4px 18px ${C.blueGlow}`,
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = `0 6px 24px ${C.blueGlow}`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = `0 4px 18px ${C.blueGlow}`
          }}
        >
          {activeImpulse ? (
            <>
              <Zap size={18} />
              Weitermachen
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Impuls starten
            </>
          )}
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "#EFF2F5",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(inProgressSkills.length / 3) * 100}%` }}
          transition={{ duration: 0.8, delay: 0.3 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${C.blue}, #3388FF)`,
            borderRadius: "0 3px 3px 0",
          }}
        />
      </div>
    </div>
  )
}

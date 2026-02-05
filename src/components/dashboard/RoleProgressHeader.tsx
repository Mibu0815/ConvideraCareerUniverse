// src/components/dashboard/RoleProgressHeader.tsx
"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Target, ChevronRight } from "lucide-react"

interface Props {
  currentRoleName: string | null
  targetRoleName: string | null
  progressPercent: number // 0-100
  focusedSkillsCount: number
  totalGapsCount: number
}

const C = {
  blue: "#0055FF",
  blueGlow: "rgba(0,85,255,0.4)",
  dark: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
}

export function RoleProgressHeader({
  currentRoleName,
  targetRoleName,
  progressPercent,
  focusedSkillsCount,
  totalGapsCount,
}: Props) {
  const router = useRouter()

  if (!targetRoleName) return null

  return (
    <div
      onClick={() => router.push("/my-career/compare")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "6px 14px",
        borderRadius: "12px",
        background: "rgba(0,85,255,0.04)",
        border: "1px solid rgba(0,85,255,0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(0,85,255,0.08)"
        e.currentTarget.style.borderColor = "rgba(0,85,255,0.2)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(0,85,255,0.04)"
        e.currentTarget.style.borderColor = "rgba(0,85,255,0.1)"
      }}
    >
      <Target size={14} color={C.blue} />

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: C.textMuted,
          }}
        >
          {currentRoleName || "Keine Rolle"}
        </span>
        <ChevronRight size={12} color={C.textFaint} />
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: C.dark,
          }}
        >
          {targetRoleName}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: "80px",
          height: "6px",
          background: "rgba(0,85,255,0.1)",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${C.blue}, #3388FF)`,
            borderRadius: "3px",
          }}
        />
      </div>

      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: C.blue,
        }}
      >
        {progressPercent}%
      </span>
    </div>
  )
}

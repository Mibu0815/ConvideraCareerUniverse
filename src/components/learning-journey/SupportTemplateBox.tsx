// src/components/learning-journey/SupportTemplateBox.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lightbulb,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Code,
} from "lucide-react"

interface Props {
  concept: string
  explanation: string
  template: string
  skillType?: "hard" | "soft"
}

export function SupportTemplateBox({
  concept,
  explanation,
  template,
  skillType = "hard",
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const isSoftSkill = skillType === "soft"

  // Color scheme based on skill type
  const colorClasses = isSoftSkill
    ? {
        bg: "bg-emerald-50/50 dark:bg-emerald-900/10",
        border: "border-emerald-200/50 dark:border-emerald-700/30",
        iconBg: "bg-emerald-100 dark:bg-emerald-800/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        accentText: "text-emerald-700 dark:text-emerald-300",
        buttonHover: "hover:bg-emerald-100 dark:hover:bg-emerald-800/30",
      }
    : {
        bg: "bg-blue-50/50 dark:bg-blue-900/10",
        border: "border-blue-200/50 dark:border-blue-700/30",
        iconBg: "bg-blue-100 dark:bg-blue-800/30",
        iconColor: "text-blue-600 dark:text-blue-400",
        accentText: "text-blue-700 dark:text-blue-300",
        buttonHover: "hover:bg-blue-100 dark:hover:bg-blue-800/30",
      }

  const Icon = isSoftSkill ? MessageCircle : Code

  return (
    <div
      className={`rounded-xl border ${colorClasses.bg} ${colorClasses.border} overflow-hidden transition-all duration-300`}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 p-4 text-left ${colorClasses.buttonHover} transition-colors`}
      >
        <div className={`p-2 rounded-lg ${colorClasses.iconBg}`}>
          <Lightbulb className={`h-4 w-4 ${colorClasses.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${colorClasses.accentText}`}>
              Was ist {concept}?
            </span>
            <Icon className={`h-3.5 w-3.5 ${colorClasses.iconColor} opacity-60`} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {explanation}
          </p>
        </div>
        <div className={`p-1 rounded ${colorClasses.iconColor}`}>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Full Explanation */}
              <p className="text-sm text-foreground/80 leading-relaxed">
                {explanation}
              </p>

              {/* Template Box */}
              <div className="relative">
                <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Vorlage zum Starten
                    </span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          Kopiert!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Kopieren
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-mono leading-relaxed">
                    {template}
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

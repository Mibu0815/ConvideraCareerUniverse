'use client';

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";
import {
  Sparkles, Target, ChevronRight, Zap, Flame, Clock,
  CheckCircle2, ArrowRight, Play, Brain, Award, Check, PartyPopper,
} from "lucide-react";
import type { StructuredImpulse } from "@/types/practical-impulse";
import { updateImpulseStep } from "@/app/actions/learning-journey";

/* ── Design Tokens ── */
const C = {
  blue: "#0055FF",
  blueLight: "rgba(0,85,255,0.5)",
  blueMuted: "rgba(0,85,255,0.15)",
  blueGlow: "rgba(0,85,255,0.4)",
  sage: "#22c55e",
  sageMuted: "rgba(34,197,94,0.15)",
  sageGlow: "rgba(34,197,94,0.3)",
  dark: "#0A0A0B",
  darkCard: "rgba(10,10,11,0.96)",
  text: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#E2E8F0",
  white70: "rgba(255,255,255,0.7)",
  white20: "rgba(255,255,255,0.2)",
};

const gridSvg = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(0,85,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`;

const glass: React.CSSProperties = {
  background: C.white70,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${C.white20}`,
  borderRadius: "22px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1.5px 6px rgba(0,0,0,0.03)",
};

interface InProgressSkill {
  skillId: string;
  skillName: string;
  competenceFieldName: string | null;
  currentLevel: number;
  targetLevel: number;
  learningFocusId: string;
}

interface LearningData {
  inProgressSkills: InProgressSkill[];
  activeImpulse: StructuredImpulse | null;
  completedImpulsesCount: number;
  recentCompletedImpulses: Array<{
    id: string;
    skillName: string;
    completedAt: Date | null;
    userReflection: string | null;
  }>;
  planId: string | null;
}

interface ProgressData {
  totalGaps: number;
  completedSkillsCount: number;
  progressPercent: number;
  remainingImpulses: number;
}

interface ActiveGoal {
  roleTitle: string;
  roleLevel: string;
  status: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  currentRoleId: string | null;
  targetRoleId: string | null;
  currentRole: { id: string; title: string; level: string; hasLeadership: boolean; leadershipType: string | null } | null;
  targetRole: { id: string; title: string; level: string; hasLeadership: boolean; leadershipType: string | null } | null;
  learningData?: LearningData | null;
  progressData?: ProgressData | null;
  activeGoal?: ActiveGoal | null;
  streak?: number;
  primaryFocusSkill?: InProgressSkill | null;
  primarySkillIsSoft?: boolean;
}

interface UserStateInfo {
  state: 'onboarding' | 'setup' | 'active' | 'ready';
  redirectPath: string;
  hasCurrentRole: boolean;
  hasTargetRole: boolean;
  hasFocusSkills: boolean;
  focusSkillsCount: number;
}

interface Props {
  userData?: UserData | null;
  userState?: UserStateInfo | null;
}

export default function CareerUniverse({ userData, userState }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedStep, setCompletedStep] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Handle completing the current step from homepage
  const handleCompleteStep = () => {
    const activeImpulse = userData?.learningData?.activeImpulse;
    if (!activeImpulse) return;

    const stepMap: Record<string, "TASK" | "REFLECTION" | "EVIDENCE"> = {
      "CHECK_IN": "TASK",
      "TASK": "REFLECTION",
      "REFLECTION": "EVIDENCE",
    };

    const nextStep = stepMap[activeImpulse.currentStep];
    if (!nextStep) return;

    startTransition(async () => {
      const result = await updateImpulseStep(activeImpulse.id, nextStep);
      if (result.success) {
        setCompletedStep(activeImpulse.currentStep);
        setShowSuccess(true);
        // Auto-hide success after animation and redirect
        setTimeout(() => {
          setShowSuccess(false);
          router.push('/learning-journey');
          router.refresh();
        }, 1500);
      }
    });
  };

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(24px)",
    transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.08 + 0.05}s`,
  });

  const hasFocusSkills = userState?.hasFocusSkills ?? (userData?.learningData?.inProgressSkills?.length ?? 0) > 0;
  const primarySkill = userData?.primaryFocusSkill;
  const isSoftSkill = userData?.primarySkillIsSoft ?? false;
  const activeImpulse = userData?.learningData?.activeImpulse;

  // Get user's first name for personalized greeting
  const firstName = userData?.name?.split(' ')[0] || null;

  // Color scheme based on skill type
  const accentColor = isSoftSkill ? C.sage : C.blue;
  const accentMuted = isSoftSkill ? C.sageMuted : C.blueMuted;
  const accentGlow = isSoftSkill ? C.sageGlow : C.blueGlow;

  // Dynamic headline based on user state and active goal
  const getHeadline = () => {
    // Personalized greeting with name
    if (firstName && userData?.activeGoal) {
      return `Hey ${firstName}, dein Weg zum ${userData.activeGoal.roleTitle}`;
    }
    if (firstName && userData?.targetRole) {
      return `Hey ${firstName}, dein Weg zum ${userData.targetRole.title}`;
    }
    if (firstName) {
      return `Hey ${firstName}, starte deine Karriere-Reise`;
    }
    if (userData?.activeGoal) {
      return `Dein Weg zum ${userData.activeGoal.roleTitle}`;
    }
    if (userData?.targetRole) {
      return `Dein Weg zum ${userData.targetRole.title}`;
    }
    return "Deine Karriere-Reise beginnt";
  };

  // Get subheadline based on focus skill
  const getSubheadline = () => {
    if (primarySkill && hasFocusSkills) {
      return (
        <>
          Aktueller Fokus: <strong style={{ color: accentColor }}>{primarySkill.skillName}</strong>
          {" • "}
          {userData?.learningData?.inProgressSkills?.length ?? 0} Skills in Arbeit
        </>
      );
    }
    if (userState?.state === 'setup') {
      return "W\u00e4hle Skills aus, um mit praktischen \u00dcbungen zu starten";
    }
    return "W\u00e4hle deine Zielrolle und starte mit praktischen \u00dcbungen";
  };

  // Smart navigation handler
  const handleLaunchClick = () => {
    if (hasFocusSkills) {
      router.push('/learning-journey');
    } else {
      router.push('/my-career/compare');
    }
  };

  // Build radar data from focused skills
  const focusedSkillsRadarData = userData?.learningData?.inProgressSkills?.map(skill => ({
    skill: skill.skillName.length > 12 ? skill.skillName.slice(0, 12) + '...' : skill.skillName,
    current: skill.currentLevel * 25,
    target: skill.targetLevel * 25,
  })) ?? [];

  // Get step info for active impulse
  const getStepInfo = () => {
    if (!activeImpulse) return null;
    switch (activeImpulse.currentStep) {
      case "CHECK_IN": return { label: "Check-In", icon: Play, progress: 25 };
      case "TASK": return { label: "Aufgabe", icon: Clock, progress: 50 };
      case "REFLECTION": return { label: "Reflexion", icon: Brain, progress: 75 };
      default: return { label: "Evidence", icon: Award, progress: 100 };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .gc{transition:transform .3s ease,box-shadow .3s ease}
        .gc:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,.1),0 4px 14px rgba(0,0,0,.04)!important}
        .cta-btn{transition:all .3s ease}
        .cta-btn:hover{transform:translateY(-2px)}
        .nav-link{transition:color .2s;cursor:pointer}
        .nav-link:hover{color:#0A0A0B!important}
        .timeline-item{transition:all .2s ease}
        .timeline-item:hover{background:rgba(0,0,0,0.02)}
      `}</style>

      <div style={{
        fontFamily: "'Outfit',sans-serif",
        minHeight: "100vh",
        background: "#F8FAFC",
        backgroundImage: gridSvg,
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ── Animated Blobs ── */}
        <div style={{
          position: "absolute", top: "-5%", left: "-8%",
          width: "520px", height: "520px", borderRadius: "50%",
          background: `radial-gradient(circle, ${isSoftSkill ? 'rgba(34,197,94,0.15)' : 'rgba(0,85,255,0.15)'} 0%, transparent 70%)`,
          filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
        }}/>

        {/* ── Fixed Header with Progress Bar ── */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(248,250,252,0.85)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226,232,240,0.5)",
        }}>
          {/* Main Nav */}
          <div style={{
            height: "60px", padding: "0 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: C.dark,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "14px", fontWeight: 700,
              }}>c</div>
              <span style={{ fontSize: "16px", fontWeight: 600, color: C.dark }}>convidera</span>
            </div>

            {/* Center: Live Status */}
            {primarySkill && (
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "6px 16px", borderRadius: "20px",
                background: accentMuted,
                border: `1px solid ${accentColor}20`,
              }}>
                <Target size={14} color={accentColor} />
                <span style={{ fontSize: "13px", fontWeight: 500, color: C.dark }}>
                  Dein Fokus heute: <strong style={{ color: accentColor }}>{primarySkill.skillName}</strong>
                </span>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <nav style={{ display: "flex", gap: "20px" }}>
                {["Dashboard", "Journey", "Karriere"].map((n, i) => {
                  const routes: Record<string, string> = {
                    'Dashboard': '/',
                    'Journey': '/learning-journey',
                    'Karriere': '/my-career',
                  };
                  return (
                    <span
                      key={n}
                      className="nav-link"
                      onClick={() => router.push(routes[n])}
                      style={{
                        fontSize: "13px", fontWeight: i === 0 ? 600 : 450,
                        color: i === 0 ? C.dark : C.textFaint,
                      }}
                    >{n}</span>
                  );
                })}
              </nav>

              {/* Streak Counter */}
              {(userData?.streak ?? 0) > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "5px 12px", borderRadius: "16px",
                  background: "rgba(251,146,60,0.1)",
                  border: "1px solid rgba(251,146,60,0.2)",
                }}>
                  <Flame size={14} color="#F97316" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#F97316" }}>
                    {userData?.streak} Tage
                  </span>
                </div>
              )}

              <div
                onClick={() => router.push('/my-career')}
                style={{
                  width: "34px", height: "34px", borderRadius: "50%", cursor: "pointer",
                  background: `linear-gradient(135deg, ${accentColor}, ${isSoftSkill ? '#16a34a' : '#3366FF'})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: "13px", fontWeight: 600,
                }}
              >{userData?.name?.[0]?.toUpperCase() || "?"}</div>
            </div>
          </div>

          {/* Roadmap Progress Bar */}
          {userData?.targetRole && userData?.progressData && (
            <div style={{
              height: "32px", padding: "0 40px",
              display: "flex", alignItems: "center", gap: "16px",
              borderTop: "1px solid rgba(226,232,240,0.3)",
              background: "rgba(255,255,255,0.5)",
            }}>
              <span style={{ fontSize: "11px", color: C.textMuted }}>
                {userData.currentRole?.title || "Start"}
              </span>
              <div style={{
                flex: 1, height: "6px", maxWidth: "300px",
                background: "rgba(0,0,0,0.06)", borderRadius: "3px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${userData.progressData.progressPercent}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${accentColor}, ${isSoftSkill ? '#4ade80' : '#3388FF'})`,
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: C.dark }}>
                {userData.targetRole.title}
              </span>
              <span style={{ fontSize: "11px", color: C.textFaint }}>
                Noch ~{userData.progressData.remainingImpulses} Impulse
              </span>
            </div>
          )}
        </header>

        {/* ── Main Content ── */}
        <main style={{
          paddingTop: userData?.targetRole ? "120px" : "88px",
          padding: `${userData?.targetRole ? "120px" : "88px"} 40px 60px`,
          maxWidth: "1200px", margin: "0 auto",
          position: "relative", zIndex: 1,
        }}>

          {/* ═══ Hero Section ═══ */}
          <div style={{ ...anim(0), marginBottom: "48px" }}>
            <h1 style={{
              fontSize: "42px", fontWeight: 800, lineHeight: 1.1,
              color: C.dark, letterSpacing: "-1.5px", marginBottom: "12px",
            }}>
              {getHeadline()}
            </h1>
            <p style={{
              fontSize: "17px", fontWeight: 400, color: C.textMuted,
              maxWidth: "600px",
            }}>
              {getSubheadline()}
            </p>
            {/* Stats below headline when user has progress */}
            {hasFocusSkills && (userData?.learningData?.completedImpulsesCount ?? 0) > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: "16px",
                marginTop: "16px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "20px",
                  background: "rgba(16,185,129,0.1)",
                }}>
                  <CheckCircle2 size={14} color="#10B981" />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#10B981" }}>
                    {userData?.learningData?.completedImpulsesCount} Impulse erledigt
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ═══ Main Grid ═══ */}
          <div style={{
            display: "grid",
            gridTemplateColumns: hasFocusSkills ? "1.3fr 1fr" : "1fr 1fr",
            gap: "24px",
          }}>

            {/* ═══ LEFT COLUMN ═══ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Next-Action Widget */}
              {primarySkill ? (
                <div
                  className="gc"
                  onClick={() => router.push('/learning-journey')}
                  style={{
                    ...anim(1),
                    background: isSoftSkill
                      ? "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%)"
                      : "linear-gradient(135deg, rgba(0,85,255,0.08) 0%, rgba(0,85,255,0.02) 100%)",
                    border: `1px solid ${isSoftSkill ? 'rgba(34,197,94,0.2)' : 'rgba(0,85,255,0.2)'}`,
                    borderRadius: "22px",
                    padding: "0",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{
                    padding: "20px 24px",
                    borderBottom: `1px solid ${isSoftSkill ? 'rgba(34,197,94,0.15)' : 'rgba(0,85,255,0.15)'}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{
                        fontSize: "10px", fontWeight: 700, color: accentColor,
                        letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "4px",
                      }}>
                        {isSoftSkill ? "Soft Skill" : "Hard Skill"} • Level {primarySkill.currentLevel} → {primarySkill.targetLevel}
                      </div>
                      <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.dark }}>
                        {primarySkill.skillName}
                      </h2>
                    </div>
                    <div style={{
                      width: "48px", height: "48px", borderRadius: "14px",
                      background: `${accentColor}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Target size={24} color={accentColor} />
                    </div>
                  </div>

                  {/* Active Impulse Status */}
                  {activeImpulse && stepInfo && (
                    <div style={{
                      padding: "16px 24px",
                      background: "rgba(255,255,255,0.6)",
                      borderBottom: `1px solid ${isSoftSkill ? 'rgba(34,197,94,0.1)' : 'rgba(0,85,255,0.1)'}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: `${accentColor}15`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <stepInfo.icon size={18} color={accentColor} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: C.dark, marginBottom: "6px" }}>
                            Impuls aktiv: {stepInfo.label}
                          </div>
                          <div style={{
                            height: "5px", background: "rgba(0,0,0,0.08)",
                            borderRadius: "3px", overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${stepInfo.progress}%`,
                              height: "100%",
                              background: accentColor,
                              borderRadius: "3px",
                            }} />
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: accentColor }}>
                          {stepInfo.progress}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* CTA - Dynamic based on impulse step */}
                  <div style={{ padding: "20px 24px" }}>
                    <AnimatePresence mode="wait">
                      {showSuccess ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            gap: "12px", padding: "14px 24px", borderRadius: "14px",
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.3)",
                          }}
                        >
                          <motion.div
                            initial={{ rotate: -20, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          >
                            <PartyPopper size={24} color="#10B981" />
                          </motion.div>
                          <span style={{ fontSize: "15px", fontWeight: 600, color: "#10B981" }}>
                            {completedStep === "TASK" ? "Super gemacht!" : "Weiter so!"}
                          </span>
                        </motion.div>
                      ) : activeImpulse?.currentStep === "TASK" ? (
                        <motion.div
                          key="task-actions"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
                        >
                          {/* Primary: Complete Task */}
                          <button
                            className="cta-btn"
                            onClick={(e) => { e.stopPropagation(); handleCompleteStep(); }}
                            disabled={isPending}
                            style={{
                              width: "100%",
                              background: `linear-gradient(135deg, #10B981, #059669)`,
                              color: "#fff", border: "none",
                              padding: "14px 24px", borderRadius: "14px",
                              fontSize: "15px", fontWeight: 600, cursor: isPending ? "wait" : "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                              fontFamily: "'Outfit', sans-serif",
                              boxShadow: "0 4px 18px rgba(16,185,129,0.3)",
                              opacity: isPending ? 0.7 : 1,
                            }}
                          >
                            {isPending ? (
                              <>Wird gespeichert...</>
                            ) : (
                              <><Check size={18} /> Aufgabe erledigt</>
                            )}
                          </button>
                          {/* Secondary: Go to details */}
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push('/learning-journey'); }}
                            style={{
                              width: "100%",
                              background: "transparent",
                              color: C.textMuted, border: `1px solid ${C.border}`,
                              padding: "10px 20px", borderRadius: "12px",
                              fontSize: "13px", fontWeight: 500, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            Aufgabe ansehen <ArrowRight size={14} />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="default-cta"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="cta-btn"
                          onClick={(e) => { e.stopPropagation(); router.push('/learning-journey'); }}
                          style={{
                            width: "100%",
                            background: `linear-gradient(135deg, ${accentColor}, ${isSoftSkill ? '#16a34a' : '#0044DD'})`,
                            color: "#fff", border: "none",
                            padding: "14px 24px", borderRadius: "14px",
                            fontSize: "15px", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: `0 4px 18px ${accentGlow}`,
                          }}
                        >
                          {activeImpulse ? (
                            <><Zap size={18} /> Impuls fortsetzen</>
                          ) : (
                            <><Sparkles size={18} /> Neuen Impuls starten</>
                          )}
                          <ArrowRight size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                /* Empty State - No Focus Skills */
                <div
                  className="gc"
                  onClick={() => router.push('/my-career/compare')}
                  style={{
                    ...glass, ...anim(1),
                    padding: "32px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "20px",
                    background: C.blueMuted, margin: "0 auto 20px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Target size={28} color={C.blue} />
                  </div>
                  <h3 style={{ fontSize: "20px", fontWeight: 700, color: C.dark, marginBottom: "8px" }}>
                    Starte deine Journey
                  </h3>
                  <p style={{ fontSize: "14px", color: C.textMuted, marginBottom: "24px" }}>
                    Wähle Skills aus, die du verbessern möchtest. Der AI Mentor erstellt dann personalisierte Übungen für dich.
                  </p>
                  <div style={{
                    background: C.blue, color: "#fff",
                    padding: "12px 24px", borderRadius: "12px",
                    fontSize: "14px", fontWeight: 600,
                    display: "inline-flex", alignItems: "center", gap: "8px",
                  }}>
                    Skills auswählen <ArrowRight size={14} />
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div style={{ ...glass, ...anim(2), padding: "0", overflow: "hidden" }}>
                <div style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 700, color: C.dark }}>
                    Letzte Aktivitäten
                  </h3>
                  <span style={{ fontSize: "12px", color: C.textFaint }}>
                    {userData?.learningData?.completedImpulsesCount ?? 0} Impulse gesamt
                  </span>
                </div>

                {(userData?.learningData?.recentCompletedImpulses?.length ?? 0) > 0 ? (
                  <div>
                    {userData?.learningData?.recentCompletedImpulses?.slice(0, 3).map((impulse, i) => (
                      <div
                        key={impulse.id}
                        className="timeline-item"
                        style={{
                          padding: "14px 20px",
                          borderBottom: i < 2 ? `1px solid ${C.border}` : "none",
                          display: "flex", alignItems: "center", gap: "12px",
                        }}
                      >
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "rgba(16,185,129,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <CheckCircle2 size={16} color="#10B981" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: C.dark }}>
                            {impulse.skillName}
                          </div>
                          <div style={{ fontSize: "11px", color: C.textFaint }}>
                            {impulse.completedAt
                              ? new Date(impulse.completedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
                              : 'Kürzlich'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "32px 20px", textAlign: "center" }}>
                    <p style={{ fontSize: "13px", color: C.textFaint }}>
                      Noch keine Impulse abgeschlossen
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ RIGHT COLUMN ═══ */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Mini Radar Chart - Focused Skills Only */}
              {focusedSkillsRadarData.length > 0 && (
                <div
                  className="gc"
                  onClick={() => router.push('/my-career/compare')}
                  style={{ ...glass, ...anim(3), padding: "20px", cursor: "pointer" }}
                >
                  <div style={{
                    fontSize: "10px", fontWeight: 700, color: C.textFaint,
                    letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px",
                  }}>
                    Skill-Balance (Fokus)
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={focusedSkillsRadarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke={C.border} strokeWidth={1} />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fontSize: 10, fontWeight: 500, fill: C.textMuted, fontFamily: "Outfit" }}
                        tickLine={false} axisLine={false}
                      />
                      <Radar name="Target" dataKey="target"
                        stroke={C.textFaint} fill={C.textFaint} fillOpacity={0.05}
                        strokeWidth={1.5} strokeDasharray="4 3"
                      />
                      <Radar name="Current" dataKey="current"
                        stroke={accentColor} fill={accentColor} fillOpacity={0.2}
                        strokeWidth={2} dot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: accentColor }} />
                      <span style={{ fontSize: "11px", color: C.textFaint }}>Aktuell</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "16px", height: "0px", borderTop: `2px dashed ${C.textFaint}` }} />
                      <span style={{ fontSize: "11px", color: C.textFaint }}>Ziel</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Focus Skills Count */}
                <div style={{ ...glass, ...anim(4), padding: "20px", textAlign: "center" }}>
                  <div style={{
                    fontSize: "10px", fontWeight: 700, color: accentColor,
                    letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "8px",
                  }}>Fokus-Skills</div>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                    {userData?.learningData?.inProgressSkills?.length ?? 0}
                    <span style={{ fontSize: "16px", color: C.textFaint, fontWeight: 500 }}>/3</span>
                  </div>
                </div>

                {/* Completed Impulses */}
                <div style={{ ...glass, ...anim(5), padding: "20px", textAlign: "center" }}>
                  <div style={{
                    fontSize: "10px", fontWeight: 700, color: "#10B981",
                    letterSpacing: ".8px", textTransform: "uppercase", marginBottom: "8px",
                  }}>Impulse</div>
                  <div style={{ fontSize: "36px", fontWeight: 800, color: C.dark, lineHeight: 1 }}>
                    {userData?.learningData?.completedImpulsesCount ?? 0}
                  </div>
                </div>
              </div>

              {/* Launch CTA */}
              <button
                className="cta-btn"
                onClick={handleLaunchClick}
                style={{
                  ...anim(6),
                  width: "100%",
                  background: C.dark, color: "#fff",
                  padding: "16px 28px", borderRadius: "16px",
                  fontSize: "15px", fontWeight: 600, border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                  fontFamily: "'Outfit',sans-serif",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <Sparkles size={18} />
                {hasFocusSkills ? "Learning Journey öffnen" : "Ziele definieren"}
                <ChevronRight size={16} />
              </button>

              {/* AI Tip */}
              <div style={{
                ...anim(7), background: C.darkCard,
                backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: "18px",
                padding: "20px", color: "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Zap size={14} color="#60A5FA" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                    AI Mentor Tipp
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  {primarySkill
                    ? `Fokussiere dich auf "${primarySkill.skillName}" – kleine, regelmäßige Übungen bringen dich schneller ans Ziel.`
                    : "Wähle bis zu 3 Skills aus, um personalisierte Übungen zu erhalten."}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

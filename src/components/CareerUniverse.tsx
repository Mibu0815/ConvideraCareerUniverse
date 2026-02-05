'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from "recharts";
import {
  Sparkles, Brain, Target, TrendingUp, X, ArrowRight, Zap, ChevronRight,
} from "lucide-react";
import { CurrentFocusWidget } from "@/components/dashboard/CurrentFocusWidget";
import type { StructuredImpulse } from "@/types/practical-impulse";

/* ── Convidera Design Tokens ── */
const C = {
  blue: "#0055FF",
  blueLight: "rgba(0,85,255,0.5)",
  blueMuted: "rgba(0,85,255,0.15)",
  blueGlow: "rgba(0,85,255,0.4)",
  blueFaint: "rgba(0,85,255,0.05)",
  dark: "#0A0A0B",
  darkCard: "rgba(10,10,11,0.96)",
  text: "#0A0A0B",
  textMuted: "#64748B",
  textFaint: "#94A3B8",
  border: "#E2E8F0",
  white70: "rgba(255,255,255,0.7)",
  white20: "rgba(255,255,255,0.2)",
  white08: "rgba(255,255,255,0.08)",
};

/* ── Inline SVG grid (40×40, convidera-blue stroke at 5% opacity) ── */
const gridSvg = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(0,85,255,0.05)' stroke-width='1'/%3E%3C/svg%3E")`;

const radarData = [
  { skill: "Management", current: 72, target: 90 },
  { skill: "Analyse", current: 85, target: 88 },
  { skill: "Strategie", current: 48, target: 82 },
  { skill: "Development", current: 90, target: 92 },
  { skill: "Content", current: 55, target: 75 },
  { skill: "Design", current: 35, target: 65 },
];

const roleOptions = [
  // Consulting & Strategy
  "Junior Consultant",
  "Professional Consultant",
  "Senior Consultant",
  "Functional Lead Consulting",
  "Head of Consulting",
  // Product Management
  "Junior Product Owner",
  "Professional Product Owner",
  "Senior Product Owner",
  "Functional Lead Product Management",
  "Head of Product",
  // Software Engineering
  "Senior Backend Developer",
  "Functional Lead Backend Development",
  "Functional Lead Frontend Development",
  "Functional Lead DevOps",
  "Head of Software Engineering",
  // Digital Marketing
  "Junior Digital Marketing Manager",
  "Professional Digital Marketing Manager",
  "Senior Digital Marketing Manager",
  "Functional Lead Digital Marketing",
  "Head of Marketing",
  // Design
  "Functional Lead UX Design",
  "Head of Design",
  // Operations
  "Head of Operations",
];

const glass: React.CSSProperties = {
  background: C.white70,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${C.white20}`,
  borderRadius: "22px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.06), 0 1.5px 6px rgba(0,0,0,0.03)",
};

const features = [
  { icon: Brain, title: "Intelligente Analysen", sub: "powered by Claude AI" },
  { icon: Target, title: "Klare Karriereziele", sub: "Skill-Gap Analyse" },
  { icon: TrendingUp, title: "Wachsende Verantwortung", sub: "Sichtbarer Fortschritt" },
];

const navItems = ["Dashboard", "Karriereziele", "Lernpfad", "Insights", "Einstellungen"];

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
}

interface Props {
  userData?: UserData | null;
}

export default function CareerUniverse({ userData }: Props) {
  const router = useRouter();
  const fromRole = userData?.currentRole?.title || "";
  const toRole = userData?.targetRole?.title || "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const anim = (i: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(32px)",
    transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 0.1 + 0.06}s`,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes blob1{
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(30px,-50px) scale(1.1)}
          66%{transform:translate(-20px,20px) scale(0.9)}
        }
        @keyframes blob2{
          0%,100%{transform:translate(0,0) scale(1)}
          33%{transform:translate(-40px,30px) scale(1.12)}
          66%{transform:translate(25px,-40px) scale(0.88)}
        }
        @keyframes btnGlow{
          0%,100%{box-shadow:0 4px 18px rgba(0,85,255,0.08)}
          50%{box-shadow:0 4px 36px rgba(0,85,255,0.28)}
        }

        .gc{transition:transform .3s ease,box-shadow .3s ease}
        .gc:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,.1),0 4px 14px rgba(0,0,0,.04)!important}
        .launch-btn{transition:all .3s ease}
        .launch-btn:hover{box-shadow:0 0 20px rgba(0,85,255,0.4),0 4px 14px rgba(0,0,0,.2)!important;transform:translateY(-2px)}
        .nav-link{transition:color .2s;cursor:pointer}
        .nav-link:hover{color:#0A0A0B!important}
        .ss{appearance:none;-webkit-appearance:none;font-family:'Outfit',sans-serif;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat:no-repeat;background-position:right 14px center;padding-right:38px}
        .ss:focus{outline:none;border-color:#0055FF;box-shadow:0 0 0 3px rgba(0,85,255,.12)}
        .mentor-btn{transition:all .3s ease}
        .mentor-btn:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(0,85,255,0.45)!important}
        .outline-btn{transition:all .25s ease}
        .outline-btn:hover{border-color:#0055FF!important;background:rgba(0,85,255,.04)!important}
        .close-btn{transition:all .2s}
        .close-btn:hover{background:rgba(255,255,255,.18)!important;color:rgba(255,255,255,.8)!important}
      `}</style>

      <div style={{
        fontFamily: "'Outfit',sans-serif",
        minHeight: "100vh",
        background: "#F8FAFC",
        backgroundImage: gridSvg,
        backgroundRepeat: "repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* ── Animated Blobs ── */}
        <div style={{
          position: "absolute", top: "-5%", left: "-8%",
          width: "620px", height: "620px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,85,255,0.2) 0%, rgba(0,85,255,0.05) 45%, transparent 70%)",
          filter: "blur(60px)",
          animation: "blob1 7s infinite ease-in-out",
          pointerEvents: "none", zIndex: 0,
        }}/>
        <div style={{
          position: "absolute", top: "20%", left: "15%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,85,255,0.15) 0%, rgba(0,85,255,0.03) 45%, transparent 70%)",
          filter: "blur(80px)",
          animation: "blob2 7s infinite ease-in-out",
          animationDelay: "-3.5s",
          pointerEvents: "none", zIndex: 0,
        }}/>

        {/* ── Fixed Header ── */}
        <header style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: "64px", padding: "0 44px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(248,250,252,0.72)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(226,232,240,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "9px",
              background: C.dark,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "15px", fontWeight: 700,
            }}>c</div>
            <span style={{ fontSize: "17px", fontWeight: 600, color: C.dark, letterSpacing: "-.3px" }}>convidera</span>
          </div>

          {/* Center: Role Progress Indicator */}
          {userData?.targetRole && (
            <div
              onClick={() => router.push('/my-career/compare')}
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
              className="progress-header"
            >
              <Target size={14} color={C.blue} />
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 500, color: C.textMuted }}>
                  {userData.currentRole?.title || "Start"}
                </span>
                <ChevronRight size={12} color={C.textFaint} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: C.dark }}>
                  {userData.targetRole.title}
                </span>
              </div>
              <div style={{
                width: "80px", height: "6px",
                background: "rgba(0,85,255,0.1)",
                borderRadius: "3px", overflow: "hidden",
              }}>
                <div style={{
                  width: `${userData.progressData?.progressPercent || 0}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${C.blue}, #3388FF)`,
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: C.blue }}>
                {userData.progressData?.progressPercent || 0}%
              </span>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <nav style={{ display: "flex", gap: "24px" }}>
              {["Dashboard", "Lernpfad", "Karriereziele"].map((n, i) => {
                const routes: Record<string, string> = {
                  'Dashboard': '/',
                  'Karriereziele': '/my-career',
                  'Lernpfad': '/learning-journey',
                };
                return (
                  <span
                    key={n}
                    className="nav-link"
                    onClick={() => router.push(routes[n] || '/')}
                    style={{
                      fontSize: "13px", fontWeight: i === 0 ? 600 : 450,
                      color: i === 0 ? C.dark : C.textFaint, letterSpacing: ".3px",
                      cursor: "pointer",
                    }}
                  >{n}</span>
                );
              })}
            </nav>
            <div
              onClick={() => router.push('/my-career')}
              suppressHydrationWarning
              style={{
                width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer",
                background: `linear-gradient(135deg,${C.blue},#3366FF)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "14px", fontWeight: 600,
                boxShadow: `0 2px 12px ${C.blueGlow}`,
              }}
            >{userData?.name?.[0]?.toUpperCase() || "?"}</div>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{
          paddingTop: "96px", padding: "96px 44px 60px",
          display: "flex", gap: "48px", maxWidth: "1440px", margin: "0 auto",
          position: "relative", zIndex: 1, flexWrap: "wrap",
        }}>

          {/* ═══ LEFT: Hero ═══ */}
          <div style={{
            flex: "1 1 400px", maxWidth: "520px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            minHeight: "580px",
          }}>
            <div style={anim(0)}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px", background: C.dark,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "32px",
                boxShadow: "0 4px 20px rgba(0,0,0,.16)",
              }}>c</div>
              <h1 style={{
                fontSize: "54px", fontWeight: 800, lineHeight: 1.04,
                color: C.dark, letterSpacing: "-2.5px", marginBottom: "8px",
              }}>
                Convidera<br/>Career Universe 2.0
              </h1>
              <p style={{
                fontSize: "42px", fontWeight: 300, color: C.textFaint,
                letterSpacing: "-.5px", marginBottom: "20px",
              }}>Skalierbar.</p>
              <p style={{
                fontSize: "16px", fontWeight: 400, color: C.textMuted,
                lineHeight: 1.7, marginBottom: "38px", maxWidth: "380px", letterSpacing: ".4px",
              }}>
                KI-gestützte Karriereplanung &amp; Skill-Gap Analyse
              </p>
              <button className="launch-btn" onClick={() => router.push('/my-career')} style={{
                background: C.dark, color: "#fff",
                padding: "15px 34px", borderRadius: "14px",
                fontSize: "15px", fontWeight: 600, border: "none", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "10px",
                animation: "btnGlow 4s ease-in-out infinite",
                letterSpacing: ".2px", fontFamily: "'Outfit',sans-serif",
              }}>
                <Sparkles size={18}/>Launch Universe
              </button>
            </div>

            <div style={{ ...anim(1), display: "flex", gap: "44px", marginTop: "76px" }}>
              {features.map(({ icon: Icon, title, sub }) => (
                <div key={title} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  textAlign: "center", maxWidth: "115px",
                }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    border: `1.5px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "13px",
                  }}>
                    <Icon size={22} color={C.textMuted} strokeWidth={1.5}/>
                  </div>
                  <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#334155", lineHeight: 1.4, letterSpacing: ".15px" }}>{title}</span>
                  <span style={{ fontSize: "10.5px", fontWeight: 400, color: C.textFaint, marginTop: "3px" }}>{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ RIGHT: Widgets ═══ */}
          <div style={{ flex: "1 1 540px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Role Selector - Clickable Card */}
            <div
              className="gc"
              onClick={() => router.push('/my-career')}
              style={{
                ...glass, ...anim(2),
                padding: "20px 26px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: C.textFaint, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "7px", display: "block" }}>Aktuelle Rolle</label>
                <div style={{
                  padding: "10px 14px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 500,
                  color: fromRole ? C.dark : C.textFaint, background: "rgba(255,255,255,.85)",
                }}>
                  {fromRole || "Rolle wählen →"}
                </div>
              </div>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%", background: C.blue,
                display: "flex", alignItems: "center", justifyContent: "center", marginTop: "22px", flexShrink: 0,
              }}>
                <ArrowRight size={16} color="#fff"/>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "10.5px", fontWeight: 700, color: C.textFaint, letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "7px", display: "block" }}>Zielrolle</label>
                <div style={{
                  padding: "10px 14px", borderRadius: "12px",
                  border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 500,
                  color: toRole ? C.dark : C.textFaint, background: "rgba(255,255,255,.85)",
                }}>
                  {toRole || "Ziel wählen →"}
                </div>
              </div>
            </div>

            {/* 2×2 Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "20px" }}>

              {/* Current Focus Widget - Dynamic */}
              <CurrentFocusWidget
                inProgressSkills={userData?.learningData?.inProgressSkills ?? []}
                activeImpulse={userData?.learningData?.activeImpulse ?? null}
                completedImpulsesCount={userData?.learningData?.completedImpulsesCount ?? 0}
                animStyle={anim(3)}
              />

              {/* Radar Chart - Clickable */}
              <div
                className="gc"
                onClick={() => router.push('/learning-journey')}
                style={{ ...glass, ...anim(4), padding: "22px", position: "relative", cursor: "pointer" }}
              >
                <span style={{
                  position: "absolute", top: "18px", right: "18px", zIndex: 2,
                  background: C.blue, color: "#fff", fontSize: "9.5px", fontWeight: 700,
                  padding: "3.5px 10px", borderRadius: "7px", letterSpacing: ".9px",
                }}>LERNPFAD</span>
                <ResponsiveContainer width="100%" height={245}>
                  <RadarChart data={radarData} cx="50%" cy="52%" outerRadius="72%">
                    <PolarGrid stroke={C.border} strokeWidth={1}/>
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 11, fontWeight: 600, fill: C.textMuted, fontFamily: "Outfit" }}
                      tickLine={false} axisLine={false}
                    />
                    <Radar name="Target" dataKey="target"
                      stroke={C.textFaint} fill={C.textFaint} fillOpacity={0.05}
                      strokeWidth={1.5} strokeDasharray="6 3"
                    />
                    <Radar name="Current" dataKey="current"
                      stroke={C.blue} fill={C.blue} fillOpacity={0.15}
                      strokeWidth={2} dot={{ r: 3.5, fill: C.blue, strokeWidth: 0 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", justifyContent: "center", gap: "22px", marginTop: "-2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.blue }}/>
                    <span style={{ fontSize: "11px", color: C.textFaint, fontWeight: 500 }}>Aktuell</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "16px", height: "0px", borderTop: `2px dashed ${C.textFaint}` }}/>
                    <span style={{ fontSize: "11px", color: C.textFaint, fontWeight: 500 }}>Ziel</span>
                  </div>
                </div>
              </div>

              {/* Career Path - Clickable */}
              <div
                className="gc"
                onClick={() => router.push('/my-career')}
                style={{
                  ...glass, ...anim(5), padding: "28px", position: "relative",
                  display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "180px",
                  cursor: "pointer",
                }}
              >
                <span style={{
                  position: "absolute", top: "18px", right: "18px",
                  background: C.blue, color: "#fff", fontSize: "9.5px", fontWeight: 700,
                  padding: "3.5px 10px", borderRadius: "7px", letterSpacing: ".9px",
                }}>START</span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: C.dark, lineHeight: 1.3, marginBottom: "10px", paddingRight: "54px" }}>
                  Bereit für deine Karriere-Reise?
                </h3>
                <p style={{ fontSize: "12.5px", color: C.textFaint, lineHeight: 1.65, marginBottom: "24px" }}>
                  Wähle deine Rollen für einen detaillierten Vergleich aller Skills und Verantwortlichkeiten.
                </p>
                <div style={{
                  background: C.blue, color: "#fff",
                  padding: "10px 22px", borderRadius: "12px",
                  fontSize: "13px", fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  alignSelf: "flex-start",
                }}>
                  Vergleich starten <ArrowRight size={14}/>
                </div>
              </div>

              {/* AI Mentor Tip Card (Simplified) */}
              <div className="gc" style={{
                ...anim(6), background: C.darkCard,
                backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: "22px",
                padding: "24px", position: "relative", color: "#fff",
                boxShadow: "0 8px 40px rgba(0,0,0,.24), 0 2px 8px rgba(0,0,0,.12)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                minHeight: "180px",
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={16} color="#60A5FA"/>AI Mentor Tipp
                  </h3>
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,.65)", lineHeight: 1.7 }}>
                    {userData?.learningData?.inProgressSkills && userData.learningData.inProgressSkills.length > 0
                      ? `Fokussiere dich auf "${userData.learningData.inProgressSkills[0].skillName}" - kleine, regelmäßige Übungen führen schneller zum Ziel als seltene, lange Sessions.`
                      : "Wähle bis zu 3 Skills aus, um deinen Lernpfad zu starten. Der AI Mentor erstellt dann personalisierte Übungen für dich."}
                  </p>
                </div>

                {userData?.progressData && userData.progressData.totalGaps > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,.45)" }}>
                        Fortschritt zur Zielrolle
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#60A5FA" }}>
                        {userData.progressData.completedSkillsCount} / {userData.progressData.totalGaps} Skills
                      </span>
                    </div>
                    <div style={{
                      height: "6px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${userData.progressData.progressPercent}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #60A5FA, #3B82F6)",
                        borderRadius: "3px",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

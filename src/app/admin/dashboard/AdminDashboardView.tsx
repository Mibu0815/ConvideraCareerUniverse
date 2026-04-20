'use client';

import { useState, type ReactNode } from 'react';
import type { PlatformRole } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  TrendingUp,
  Brain,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Target,
  Cpu,
  Zap,
  BookOpen,
  Award,
  Activity,
  Flame,
  Cloud,
  Shield,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Quote,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Treemap,
} from 'recharts';
import type { LeadDashboardData } from '@/lib/services/personalized-pathways';
import type { AdminAnalytics } from '@/app/actions/admin-analytics';
import type { FeedbackSummary } from '@/app/actions/feedback';
import { BlobBackground, Navigation } from '@/components/shared';
import { cn } from '@/lib/utils';

interface FeedbackStats {
  totalFeedback: number;
  positivePercentage: number;
  thisWeekCount: number;
  topSkillMentions: { skill: string; count: number }[];
}

interface AdminDashboardViewProps {
  dashboardData: LeadDashboardData;
  adminAnalytics: AdminAnalytics;
  feedbackData: FeedbackSummary;
  feedbackStats: FeedbackStats;
  userName: string;
  userRole: string;
  platformRole?: PlatformRole;
  validationBadge?: ReactNode;
}

type TabType = 'overview' | 'mitarbeiter' | 'techradar' | 'analytics' | 'feedback';

export function AdminDashboardView({ dashboardData, adminAnalytics, feedbackData, feedbackStats, userName, userRole, platformRole, validationBadge }: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  return (
    <div className="min-h-screen bg-brand-black bg-grid-dark">
      {/* Dark gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-brand-black via-slate-900 to-brand-black pointer-events-none" />
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>
      <Navigation userName={userName} platformRole={platformRole} validationBadge={validationBadge} />

      <header className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">Team-Entwicklung & Analytics im Überblick</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">{userRole}</span>
              </div>
              <p className="font-semibold text-white">{userName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Dark Theme */}
      <div className="relative border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-[8.5rem] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <TabButton
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              icon={Activity}
              label="KPI Analytics"
              dark
            />
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={BarChart3}
              label="Skill-Trends"
              dark
            />
            <TabButton
              active={activeTab === 'mitarbeiter'}
              onClick={() => setActiveTab('mitarbeiter')}
              icon={Users}
              label="Heatmap"
              dark
            />
            <TabButton
              active={activeTab === 'techradar'}
              onClick={() => setActiveTab('techradar')}
              icon={Cpu}
              label="Tech-Radar"
              dark
            />
            <TabButton
              active={activeTab === 'feedback'}
              onClick={() => setActiveTab('feedback')}
              icon={MessageSquare}
              label="Stimme des Teams"
              dark
            />
          </div>
        </div>
      </div>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalyticsTab analytics={adminAnalytics} />
            </motion.div>
          )}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <OverviewTab data={dashboardData} />
            </motion.div>
          )}
          {activeTab === 'mitarbeiter' && (
            <motion.div
              key="mitarbeiter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HeatmapTab analytics={adminAnalytics} data={dashboardData} />
            </motion.div>
          )}
          {activeTab === 'techradar' && (
            <motion.div
              key="techradar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <TechRadarTab data={dashboardData} />
            </motion.div>
          )}
          {activeTab === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FeedbackTab feedbackData={feedbackData} feedbackStats={feedbackStats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  dark = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof BarChart3;
  label: string;
  dark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 font-medium transition-all relative',
        dark
          ? active
            ? 'text-white'
            : 'text-gray-500 hover:text-gray-300'
          : active
          ? 'text-brand-gray-900'
          : 'text-brand-gray-400 hover:text-brand-gray-700'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {active && (
        <motion.div
          layoutId="adminActiveTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
        />
      )}
    </button>
  );
}

// ============================================================================
// ANALYTICS TAB - KPIs, Top Roles, Modernization Check
// ============================================================================

function AnalyticsTab({ analytics }: { analytics: AdminAnalytics }) {
  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassmorphicCard delay={0}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-green-400 font-mono">
              {Math.round((analytics.activeUsersCount / analytics.totalUsersCount) * 100)}%
            </span>
          </div>
          <div className="text-3xl font-bold text-white font-mono mb-1">
            {analytics.activeUsersCount}
          </div>
          <div className="text-sm font-medium text-gray-400">Aktive Nutzer</div>
          <div className="text-xs text-gray-500 mt-1">von {analytics.totalUsersCount} gesamt</div>
        </GlassmorphicCard>

        <GlassmorphicCard delay={0.05}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono mb-1">
            {analytics.averageGapsPerUser}
          </div>
          <div className="text-sm font-medium text-gray-400">Ø Gaps / User</div>
          <div className="text-xs text-gray-500 mt-1">Skill-Lücken zu schließen</div>
        </GlassmorphicCard>

        <GlassmorphicCard delay={0.1}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono mb-1">
            {analytics.recentActivity.impulsesCompletedThisWeek}
          </div>
          <div className="text-sm font-medium text-gray-400">Impulse / Woche</div>
          <div className="text-xs text-gray-500 mt-1">{analytics.recentActivity.impulsesCompletedToday} heute</div>
        </GlassmorphicCard>

        <GlassmorphicCard delay={0.15}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-purple-400 font-mono">{analytics.modernizationStats.percentage}%</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono mb-1">
            {analytics.modernizationStats.total2026Impulses}
          </div>
          <div className="text-sm font-medium text-gray-400">2026 Tech-Impulse</div>
          <div className="text-xs text-gray-500 mt-1">AI & Cloud enthalten</div>
        </GlassmorphicCard>
      </div>

      {/* Top 3 Target Roles & Modernization Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 3 Target Roles */}
        <GlassmorphicCard delay={0.2} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Top 3 Zielrollen
          </h3>
          <div className="space-y-4">
            {analytics.top3TargetRoles.map((role, index) => (
              <motion.div
                key={role.roleId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold',
                    index === 0
                      ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-400 to-slate-500'
                      : 'bg-gradient-to-br from-amber-700 to-orange-800'
                  )}
                >
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{role.roleName}</span>
                    <span className="text-sm text-gray-400">{role.userCount} User</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${role.percentage}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-400 to-slate-400'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600'
                      )}
                    />
                  </div>
                </div>
                <span className="text-sm font-mono text-gray-400">{Math.round(role.percentage)}%</span>
              </motion.div>
            ))}
            {analytics.top3TargetRoles.length === 0 && (
              <p className="text-center text-gray-500 py-4">Noch keine Zielrollen definiert</p>
            )}
          </div>
        </GlassmorphicCard>

        {/* Modernization Check */}
        <GlassmorphicCard delay={0.25} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            2026 Modernization Check
          </h3>
          <div className="space-y-6">
            {/* AI Tools */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-gray-300">AI-Tool Impulse</span>
                </div>
                <span className="text-lg font-bold text-purple-400 font-mono">
                  {analytics.modernizationStats.aiToolImpulses}
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      analytics.modernizationStats.totalCompletedImpulses > 0
                        ? (analytics.modernizationStats.aiToolImpulses /
                            analytics.modernizationStats.totalCompletedImpulses) *
                          100
                        : 0
                    }%`,
                  }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Claude, Copilot, ChatGPT, Cursor</p>
            </div>

            {/* Cloud Tech */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Cloud-Tech Impulse</span>
                </div>
                <span className="text-lg font-bold text-blue-400 font-mono">
                  {analytics.modernizationStats.cloudTechImpulses}
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      analytics.modernizationStats.totalCompletedImpulses > 0
                        ? (analytics.modernizationStats.cloudTechImpulses /
                            analytics.modernizationStats.totalCompletedImpulses) *
                          100
                        : 0
                    }%`,
                  }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Supabase, Vercel, Edge Functions</p>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Gesamt abgeschlossene Impulse</span>
                <span className="text-xl font-bold text-white font-mono">
                  {analytics.modernizationStats.totalCompletedImpulses}
                </span>
              </div>
            </div>
          </div>
        </GlassmorphicCard>
      </div>

      {/* Activity Feed */}
      <GlassmorphicCard delay={0.3} className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Aktivitäts-Übersicht
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-green-400 font-mono">
              {analytics.recentActivity.impulsesStartedToday}
            </div>
            <div className="text-xs text-gray-500 mt-1">Gestartet heute</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-blue-400 font-mono">
              {analytics.recentActivity.impulsesCompletedToday}
            </div>
            <div className="text-xs text-gray-500 mt-1">Abgeschlossen heute</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {analytics.recentActivity.impulsesStartedThisWeek}
            </div>
            <div className="text-xs text-gray-500 mt-1">Gestartet diese Woche</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {analytics.recentActivity.impulsesCompletedThisWeek}
            </div>
            <div className="text-xs text-gray-500 mt-1">Abgeschlossen diese Woche</div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

// ============================================================================
// HEATMAP TAB - Competence Field Training Heatmap
// ============================================================================

function HeatmapTab({ analytics, data }: { analytics: AdminAnalytics; data: LeadDashboardData }) {
  // Create heatmap data for Recharts Treemap
  const heatmapData = analytics.competenceFieldHeatmap.map((field) => ({
    name: field.fieldName,
    size: field.activeLearnersCount,
    color: field.fieldColor || '#6366F1',
    progress: Math.round(field.avgProgress),
  }));

  return (
    <div className="space-y-8">
      {/* Competence Field Heatmap */}
      <GlassmorphicCard delay={0} className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          Kompetenzfeld-Heatmap
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Training-Aktivität nach Kompetenzfeld (Größe = Anzahl Lernende)
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.competenceFieldHeatmap.map((field, index) => {
            const intensity = Math.min(field.avgProgress / 100, 1);
            const bgOpacity = 0.2 + intensity * 0.4;

            return (
              <motion.div
                key={field.fieldId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative overflow-hidden rounded-xl border border-white/10 p-4"
                style={{
                  background: `linear-gradient(135deg, rgba(99, 102, 241, ${bgOpacity}) 0%, rgba(139, 92, 246, ${bgOpacity * 0.7}) 100%)`,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-white text-sm">{field.fieldName}</h4>
                  <span className="text-xs font-mono text-indigo-300">{Math.round(field.avgProgress)}%</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold text-white font-mono">{field.activeLearnersCount}</div>
                    <div className="text-xs text-gray-400">Aktive Lerner</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-indigo-300">{field.totalSkillsInTraining}</div>
                    <div className="text-xs text-gray-400">Skills</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${field.avgProgress}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {analytics.competenceFieldHeatmap.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">Noch keine Training-Aktivität</p>
          </div>
        )}
      </GlassmorphicCard>

      {/* Skill Trends Detail - Reuse existing data */}
      <GlassmorphicCard delay={0.2} className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Top Skills in Training
        </h3>
        <div className="space-y-3">
          {data.skillTrends.slice(0, 8).map((skill, index) => (
            <motion.div
              key={skill.skillId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold',
                  skill.isAIRelated
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'bg-blue-500/30 text-blue-300'
                )}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{skill.skillName}</span>
                  {skill.isAIRelated && <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />}
                </div>
                <span className="text-xs text-gray-500">{skill.competenceField}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">{skill.learnerCount}</div>
                <div className="text-xs text-gray-500">Lerner</div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassmorphicCard>
    </div>
  );
}

// ============================================================================
// GLASSMORPHIC CARD COMPONENT
// ============================================================================

function GlassmorphicCard({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'relative overflow-hidden rounded-bento p-5',
        'bg-white/5 backdrop-blur-xl border border-white/10',
        'shadow-2xl shadow-black/20',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ data }: { data: LeadDashboardData }) {
  const summaryCards = [
    {
      label: 'Team-Größe',
      value: data.teamSize,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/30',
      description: 'Mitarbeiter insgesamt',
    },
    {
      label: 'Aktive Lerner',
      value: data.activelearners,
      icon: BookOpen,
      gradient: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/30',
      description: `${Math.round((data.activelearners / Math.max(data.teamSize, 1)) * 100)}% des Teams`,
    },
    {
      label: 'Skill-Trends',
      value: data.skillTrends.length,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-indigo-600',
      shadow: 'shadow-purple-500/30',
      description: 'Aktiv gelernte Skills',
    },
    {
      label: 'AI-Adoption',
      value: `${data.aiToolsAdoption.length}`,
      icon: Brain,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/30',
      description: 'Tools im Einsatz',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards - Dark Theme */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <GlassmorphicCard key={card.label} delay={index * 0.05}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-bento bg-gradient-to-br flex items-center justify-center shadow-lg', card.gradient, card.shadow)}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white font-mono mb-1">{card.value}</div>
            <div className="text-sm font-medium text-gray-400">{card.label}</div>
            <div className="text-xs text-gray-500 mt-1">{card.description}</div>
          </GlassmorphicCard>
        ))}
      </div>

      {/* Charts Row - Dark Theme */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skill Trends Chart */}
        <GlassmorphicCard delay={0.2} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Top Skill-Trends
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.skillTrends.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="skillName"
                  width={120}
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => (value.length > 15 ? value.slice(0, 15) + '...' : value)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="learnerCount" name="Lernende" radius={[0, 4, 4, 0]}>
                  {data.skillTrends.slice(0, 6).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isAIRelated ? '#A855F7' : '#818CF8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Lila = AI-bezogene Skills
          </p>
        </GlassmorphicCard>

        {/* AI Tools Adoption */}
        <GlassmorphicCard delay={0.3} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            AI-Tools Adoption
          </h3>
          <div className="space-y-4">
            {data.aiToolsAdoption.map((tool, index) => (
              <motion.div
                key={tool.toolName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                  <Cpu className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{tool.toolName}</span>
                    <span className="text-sm text-gray-400">{tool.userCount} Nutzer</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(tool.userCount / Math.max(data.teamSize, 1)) * 100}%` }}
                      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded-full',
                    tool.growthPercent > 50
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  )}
                >
                  +{tool.growthPercent}%
                </div>
              </motion.div>
            ))}
          </div>
        </GlassmorphicCard>
      </div>

      {/* Popular Transitions - Dark Theme */}
      <GlassmorphicCard delay={0.4} className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-400" />
          Beliebte Karrierepfade
        </h3>
        {data.popularTransitions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.popularTransitions.map((transition, index) => (
              <motion.div
                key={`${transition.fromRole}-${transition.toRole}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-300">{transition.fromRole}</span>
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-indigo-300">{transition.toRole}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{transition.count} Mitarbeiter</span>
                  <span className="text-green-400">{Math.round(transition.successRate * 100)}% Erfolg</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Noch keine Karrierepfade definiert.</p>
        )}
      </GlassmorphicCard>
    </div>
  );
}

// ============================================================================
// TECH RADAR TAB - Dark Theme
// ============================================================================

function TechRadarTab({ data }: { data: LeadDashboardData }) {
  // Create radar data from AI-related skills
  const aiSkills = data.skillTrends.filter((s) => s.isAIRelated);
  const radarData = aiSkills.length > 0
    ? aiSkills.map((skill) => ({
        skill: skill.skillName.slice(0, 12),
        fullName: skill.skillName,
        adoption: Math.min(skill.learnerCount * 20, 100),
        proficiency: skill.avgProgress * 25,
      }))
    : [
        { skill: 'Claude Code', fullName: 'Claude Code', adoption: 40, proficiency: 35 },
        { skill: 'GitHub Copilot', fullName: 'GitHub Copilot', adoption: 60, proficiency: 50 },
        { skill: 'ChatGPT', fullName: 'ChatGPT', adoption: 70, proficiency: 45 },
        { skill: 'Notion AI', fullName: 'Notion AI', adoption: 30, proficiency: 25 },
      ];

  const techQuadrants = [
    {
      name: 'Adopt',
      description: 'Bereit für breiten Einsatz',
      tools: ['GitHub Copilot', 'Claude Code'],
      gradient: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
    },
    {
      name: 'Trial',
      description: 'In Pilotprojekten testen',
      tools: ['Cursor AI', 'Notion AI'],
      gradient: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
    },
    {
      name: 'Assess',
      description: 'Evaluierung läuft',
      tools: ['v0 by Vercel', 'Bolt.new'],
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
    },
    {
      name: 'Hold',
      description: 'Nicht empfohlen',
      tools: [],
      gradient: 'from-gray-500/20 to-slate-500/20',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Tech Radar Visualization */}
      <div className="grid lg:grid-cols-2 gap-6">
        <GlassmorphicCard delay={0} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            AI-Kompetenz Radar
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} />
                <Radar
                  name="Adoption"
                  dataKey="adoption"
                  stroke="#A855F7"
                  fill="#A855F7"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Proficiency"
                  dataKey="proficiency"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassmorphicCard>

        {/* Tech Quadrants - Dark */}
        <GlassmorphicCard delay={0.1} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Technologie-Quadranten
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {techQuadrants.map((quadrant, index) => (
              <motion.div
                key={quadrant.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={cn(
                  'p-4 rounded-xl border bg-gradient-to-br',
                  quadrant.gradient,
                  quadrant.border
                )}
              >
                <h4 className={cn('font-semibold mb-1', quadrant.text)}>{quadrant.name}</h4>
                <p className="text-xs text-gray-500 mb-3">{quadrant.description}</p>
                <div className="space-y-1">
                  {quadrant.tools.map((tool) => (
                    <div key={tool} className="flex items-center gap-2 text-sm text-gray-300">
                      <ChevronRight className="w-3 h-3" />
                      {tool}
                    </div>
                  ))}
                  {quadrant.tools.length === 0 && (
                    <span className="text-xs text-gray-600">Keine Tools</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </GlassmorphicCard>
      </div>

      {/* AI Tools Comparison - Dark */}
      <GlassmorphicCard delay={0.3} className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-amber-400" />
          AI-Tool Vergleich: Adoption vs. Wachstum
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.aiToolsAdoption}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="toolName" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#9CA3AF' }} />
              <Bar dataKey="userCount" name="Nutzer" fill="#A855F7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="growthPercent" name="Wachstum %" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassmorphicCard>

      {/* Recommendations - Dark Theme */}
      <GlassmorphicCard delay={0.4} className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI-Empfehlungen für das Team
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Coding Assistants</h4>
            <p className="text-sm text-gray-400">
              Claude Code und GitHub Copilot sollten Standard-Tools für alle Entwickler sein.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Dokumentation</h4>
            <p className="text-sm text-gray-400">
              Notion AI für schnellere Knowledge-Base-Updates und Meeting-Summaries.
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Prototyping</h4>
            <p className="text-sm text-gray-400">
              v0 und Bolt.new für schnelle UI-Prototypen in der Discovery-Phase.
            </p>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

// ============================================================================
// FEEDBACK TAB - "Stimme des Teams"
// ============================================================================

function FeedbackTab({
  feedbackData,
  feedbackStats,
}: {
  feedbackData: FeedbackSummary;
  feedbackStats: FeedbackStats;
}) {
  const satisfactionRate = feedbackStats.positivePercentage;
  const satisfactionColor =
    satisfactionRate >= 80
      ? 'from-green-500 to-emerald-600'
      : satisfactionRate >= 60
      ? 'from-yellow-500 to-orange-600'
      : 'from-red-500 to-rose-600';

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <GlassmorphicCard delay={0.1} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Gesamt</span>
          </div>
          <div className="text-3xl font-bold text-white">{feedbackStats.totalFeedback}</div>
          <p className="text-sm text-gray-400 mt-1">Feedback-Einträge</p>
        </GlassmorphicCard>

        {/* Satisfaction Rate */}
        <GlassmorphicCard delay={0.2} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${satisfactionColor} flex items-center justify-center`}>
              <ThumbsUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Zufriedenheit</span>
          </div>
          <div className="text-3xl font-bold text-white">{satisfactionRate}%</div>
          <p className="text-sm text-gray-400 mt-1">Positives Feedback</p>
        </GlassmorphicCard>

        {/* This Week */}
        <GlassmorphicCard delay={0.3} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Diese Woche</span>
          </div>
          <div className="text-3xl font-bold text-white">{feedbackStats.thisWeekCount}</div>
          <p className="text-sm text-gray-400 mt-1">Neue Einträge</p>
        </GlassmorphicCard>

        {/* Top Skill */}
        <GlassmorphicCard delay={0.4} className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Top Skill</span>
          </div>
          <div className="text-lg font-bold text-white truncate">
            {feedbackStats.topSkillMentions[0]?.skill || '—'}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {feedbackStats.topSkillMentions[0]?.count || 0} Erwähnungen
          </p>
        </GlassmorphicCard>
      </div>

      {/* Satisfaction Breakdown & Recent Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Satisfaction Breakdown */}
        <GlassmorphicCard delay={0.5} className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Feedback-Verteilung
          </h3>
          <div className="space-y-4">
            {/* Positive Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  Positiv
                </span>
                <span className="text-sm font-medium text-white">{feedbackData.positiveCount}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${feedbackData.totalCount > 0 ? (feedbackData.positiveCount / feedbackData.totalCount) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>
            {/* Negative Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-orange-400" />
                  Verbesserungspotenzial
                </span>
                <span className="text-sm font-medium text-white">{feedbackData.negativeCount}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${feedbackData.totalCount > 0 ? (feedbackData.negativeCount / feedbackData.totalCount) * 100 : 0}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Top Skills Mentioned */}
          {feedbackStats.topSkillMentions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Meistgenannte Skills</h4>
              <div className="space-y-2">
                {feedbackStats.topSkillMentions.slice(0, 3).map((item, idx) => (
                  <div key={item.skill} className="flex items-center justify-between">
                    <span className="text-sm text-white">{item.skill}</span>
                    <span className="text-xs text-gray-500 bg-white/10 px-2 py-1 rounded-full">
                      {item.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassmorphicCard>

        {/* Recent Comments */}
        <GlassmorphicCard delay={0.6} className="p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Quote className="w-5 h-5 text-purple-400" />
            Stimme des Teams
            <span className="text-xs text-gray-500 ml-auto">Anonymisiert</span>
          </h3>

          {feedbackData.recentComments.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {feedbackData.recentComments.map((feedback, idx) => (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        feedback.rating === 'positive'
                          ? 'bg-green-500/20'
                          : 'bg-orange-500/20'
                      }`}
                    >
                      {feedback.rating === 'positive' ? (
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <ThumbsDown className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">{feedback.comment}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {feedback.contextSkill && (
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {feedback.contextSkill}
                          </span>
                        )}
                        <span>
                          {feedback.contextType === 'impulse_completed' ? 'Nach Impuls' : 'Skill gestartet'}
                        </span>
                        <span>
                          {new Date(feedback.createdAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">Noch kein Feedback vorhanden</p>
              <p className="text-sm text-gray-600 mt-1">
                Feedback wird gesammelt, wenn Nutzer Skills starten oder Impulse abschließen.
              </p>
            </div>
          )}
        </GlassmorphicCard>
      </div>

      {/* Insights Card */}
      <GlassmorphicCard delay={0.7} className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Feedback-Insights
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Engagement</h4>
            <p className="text-sm text-gray-400">
              {feedbackStats.thisWeekCount > 5
                ? 'Hohes Engagement diese Woche - das Team nutzt die Plattform aktiv.'
                : 'Moderates Engagement - Impulse-Erinnerungen könnten helfen.'}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Zufriedenheit</h4>
            <p className="text-sm text-gray-400">
              {satisfactionRate >= 80
                ? 'Exzellente Zufriedenheit - die Impulse treffen den Nerv.'
                : satisfactionRate >= 60
                ? 'Gute Basis - einige Impulse könnten praxisnäher sein.'
                : 'Verbesserungspotenzial - mehr reale Projektbezüge einbauen.'}
            </p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-medium text-white mb-2">Fokus-Empfehlung</h4>
            <p className="text-sm text-gray-400">
              {feedbackStats.topSkillMentions[0]
                ? `"${feedbackStats.topSkillMentions[0].skill}" erhält viel Aufmerksamkeit - hier lohnt sich vertiefender Content.`
                : 'Noch keine klaren Trends - mehr Daten sammeln.'}
            </p>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

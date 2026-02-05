'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  RefreshCw,
  GitCompare,
  TrendingUp,
  Sparkles,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { GroupedRoles } from '@/app/actions/get-roles';
import type { RoleComparisonResult } from '@/lib/services/career-logic';
import { RoleSelector } from '../../components/RoleSelector';
import { ActionCards } from './ActionCards';
import { CareerRadarChart } from './CareerRadarChart';
import { SkillDeltaView } from './SkillDeltaView';
import { ResponsibilityDeltaView } from './ResponsibilityDeltaView';
import { SoftSkillsView } from './SoftSkillsView';
import { cn } from '@/lib/utils';
import { BlobBackground, Navigation } from '@/components/shared';
import { setSkillFocus, generateOrRefreshLearningPlan } from '@/app/actions/learning-journey';
import { LernHistorie } from './LernHistorie';

interface CompletedImpulse {
  id: string;
  skillName: string;
  completedAt: Date | null;
  userReflection: string | null;
}

interface CompareViewProps {
  groupedRoles: GroupedRoles[];
  initialFromRoleId?: string | null;
  initialToRoleId?: string | null;
  userId?: string | null;
  initialFocusedSkillIds?: string[];
  initialPlanId?: string | null;
  completedImpulses?: CompletedImpulse[];
  totalFocusedSkills?: number;
}

type TabType = 'hardSkills' | 'softSkills' | 'responsibilities';

export function CompareView({
  groupedRoles,
  initialFromRoleId,
  initialToRoleId,
  userId,
  initialFocusedSkillIds = [],
  initialPlanId,
  completedImpulses = [],
  totalFocusedSkills = 0,
}: CompareViewProps) {
  const [fromRoleId, setFromRoleId] = useState<string | null>(initialFromRoleId || null);
  const [toRoleId, setToRoleId] = useState<string | null>(initialToRoleId || null);
  const [comparison, setComparison] = useState<RoleComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>('hardSkills');
  const [mentorMessage, setMentorMessage] = useState<string | null>(null);
  const [focusedSkillIds, setFocusedSkillIds] = useState<Set<string>>(new Set(initialFocusedSkillIds));
  const [focusingSkillId, setFocusingSkillId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(initialPlanId || null);

  const animationKey = `${fromRoleId}-${toRoleId}`;

  // Handler for focusing a skill
  const handleSkillFocus = useCallback(async (skillId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: 'Nicht angemeldet' };
    }

    setFocusingSkillId(skillId);

    try {
      // Ensure we have a learning plan
      let currentPlanId = planId;
      if (!currentPlanId) {
        const { planId: newPlanId } = await generateOrRefreshLearningPlan(userId);
        currentPlanId = newPlanId;
        setPlanId(newPlanId);
      }

      // Set the skill as focused
      const result = await setSkillFocus(currentPlanId, skillId, userId);

      if (result.success) {
        setFocusedSkillIds(prev => new Set([...prev, skillId]));
      }

      return result;
    } catch (err) {
      console.error('Failed to focus skill:', err);
      return { success: false, error: 'Fehler beim Fokussieren' };
    } finally {
      setFocusingSkillId(null);
    }
  }, [userId, planId]);

  const fetchComparison = useCallback(async () => {
    if (!toRoleId) return;

    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ toRoleId });
        if (fromRoleId) {
          params.append('fromRoleId', fromRoleId);
        }

        const response = await fetch(`/api/career/analyze?${params}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to compare roles');
        }

        const data = await response.json();
        setComparison(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed');
        setComparison(null);
      }
    });
  }, [fromRoleId, toRoleId]);

  useEffect(() => {
    if (toRoleId) {
      fetchComparison();
    }
  }, [toRoleId, fromRoleId, fetchComparison]);

  const handleReset = () => {
    setFromRoleId(null);
    setToRoleId(null);
    setComparison(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-gray-50 bg-grid">
      <BlobBackground />
      <Navigation />
      <header className="border-b border-brand-gray-200 bg-brand-white/80 backdrop-blur-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-bento bg-brand-black flex items-center justify-center">
                <GitCompare className="w-5 h-5 text-brand-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-brand-gray-900">Role Comparison</h1>
                <p className="text-sm text-brand-gray-400">Compare skills and responsibilities between roles</p>
              </div>
            </div>
            {comparison && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-brand-gray-500 hover:text-brand-gray-800 hover:bg-brand-gray-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-brand-white rounded-bento border border-brand-gray-200 p-6 shadow-bento">
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <RoleSelector
                label="From Role (optional)"
                placeholder="Select starting role..."
                groupedRoles={groupedRoles}
                selectedRoleId={fromRoleId}
                onSelect={setFromRoleId}
              />
              <div className="hidden md:flex items-center justify-center pb-3">
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ArrowRight className="w-6 h-6 text-brand-accent" />
                </motion.div>
              </div>
              <RoleSelector
                label="To Role"
                placeholder="Select target role..."
                groupedRoles={groupedRoles}
                selectedRoleId={toRoleId}
                onSelect={setToRoleId}
              />
            </div>

            {isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-2 text-brand-accent">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing roles...</span>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Loading Skeleton */}
        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CareerSkeleton />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {comparison && !isPending && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              <LernHistorie
                completedImpulses={completedImpulses}
                totalFocusedSkills={totalFocusedSkills}
              />

              <div className="grid lg:grid-cols-5 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-brand-white rounded-bento border border-brand-gray-200 p-6 shadow-bento">
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-brand-accent" />
                    Competence Overview
                  </h3>
                  <CareerRadarChart
                    data={comparison.radarChartData}
                    currentRoleName={comparison.fromRole?.name || 'Current Level'}
                    targetRoleName={comparison.toRole.name}
                  />
                </motion.div>

                {/* Glassmorphism Tab Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-3 relative overflow-hidden rounded-bento"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6)',
                  }}
                >
                  {/* Decorative gradient orbs */}
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Tab Navigation */}
                  <div className="flex border-b border-white/30 relative z-10">
                    <TabButton
                      active={activeTab === 'hardSkills'}
                      onClick={() => setActiveTab('hardSkills')}
                      icon={TrendingUp}
                      label="Hard Skills"
                      count={comparison.skillComparisons.filter((s) => s.delta !== 0 || s.isNew).length}
                    />
                    <TabButton
                      active={activeTab === 'softSkills'}
                      onClick={() => setActiveTab('softSkills')}
                      icon={Users}
                      label="Soft Skills"
                      count={comparison.softSkillComparisons.filter((s) => s.status === 'added').length}
                    />
                    <TabButton
                      active={activeTab === 'responsibilities'}
                      onClick={() => setActiveTab('responsibilities')}
                      icon={FileText}
                      label="Verantwortlichkeiten"
                      count={comparison.responsibilityDiff.filter((r) => r.status === 'added').length}
                    />
                  </div>

                  {/* Tab Content */}
                  <div className="p-6 max-h-[600px] overflow-y-auto relative z-10">
                    <AnimatePresence mode="wait">
                      {activeTab === 'hardSkills' && (
                        <motion.div key="hardSkills" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                          <SkillDeltaView
                            skills={comparison.skillComparisons}
                            animationKey={animationKey}
                            onSkillFocus={userId ? handleSkillFocus : undefined}
                            focusedSkillIds={focusedSkillIds}
                            focusingSkillId={focusingSkillId}
                          />
                        </motion.div>
                      )}
                      {activeTab === 'softSkills' && (
                        <motion.div key="softSkills" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                          <SoftSkillsView
                            softSkills={comparison.softSkillComparisons}
                            animationKey={animationKey}
                            onAskMentor={(msg) => setMentorMessage(msg)}
                          />
                        </motion.div>
                      )}
                      {activeTab === 'responsibilities' && (
                        <motion.div key="responsibilities" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                          <ResponsibilityDeltaView responsibilities={comparison.responsibilityDiff} animationKey={animationKey} />
                          {/* In Lernpfad integrieren Button */}
                          {comparison.responsibilityDiff.filter(r => r.status === 'added').length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="mt-6 pt-4 border-t border-white/30"
                            >
                              <button
                                onClick={() => setMentorMessage(
                                  `Gib mir konkrete Tipps, wie ich die neuen Verantwortlichkeiten in meinen Arbeitsalltag integrieren kann: ${comparison.responsibilityDiff.filter(r => r.status === 'added').map(r => r.text).slice(0, 3).join('; ')}`
                                )}
                                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-accent to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                              >
                                <Sparkles className="w-4 h-4" />
                                In Lernpfad integrieren
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {/* Action Cards - Bento Grid with AI Mentor */}
              <ActionCards
                comparison={comparison}
                fromRoleId={fromRoleId}
                toRoleId={toRoleId!}
                initialMentorMessage={mentorMessage}
                onMentorMessageConsumed={() => setMentorMessage(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!comparison && !isPending && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-brand-gray-100 flex items-center justify-center">
              <GitCompare className="w-12 h-12 text-brand-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-brand-gray-800 mb-2">Ready to compare roles?</h3>
            <p className="text-brand-gray-400 max-w-md mx-auto">Select a target role above to see a detailed comparison of skills, responsibilities, and competence requirements.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof TrendingUp; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all relative',
        active ? 'text-brand-gray-900 bg-brand-gray-50' : 'text-brand-gray-400 hover:text-brand-gray-700 hover:bg-brand-gray-50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count > 0 && (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold font-mono', active ? 'bg-brand-gray-900 text-brand-white' : 'bg-brand-gray-100 text-brand-gray-600')}>
          {count}
        </span>
      )}
      {active && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-black" />}
    </button>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CareerSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-brand-gray-100 rounded-bento" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Radar Chart Skeleton */}
        <div className="lg:col-span-2 h-[450px] bg-brand-gray-100 rounded-bento flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-brand-gray-200 border-dashed" />
        </div>

        {/* Skills/Responsibilities Skeleton */}
        <div className="lg:col-span-3 h-[450px] bg-brand-white border border-brand-gray-200 rounded-bento p-6 flex flex-col">
          <div className="flex gap-4 mb-6">
            <div className="h-10 w-32 bg-brand-gray-200 rounded-lg" />
            <div className="h-10 w-32 bg-brand-gray-100 rounded-lg" />
          </div>
          <div className="space-y-3 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-brand-gray-50 rounded-bento">
                <div className="h-4 w-1/3 bg-brand-gray-200 rounded" />
                <div className="flex-1" />
                <div className="h-6 w-16 bg-brand-gray-200 rounded" />
                <div className="h-6 w-16 bg-brand-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Upgrades */}
        <div className="h-[350px] bg-brand-gray-100 rounded-bento p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-gray-200 rounded-bento" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-brand-gray-200 rounded" />
              <div className="h-3 w-16 bg-brand-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-2 flex-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-brand-gray-200 rounded-bento" />
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="h-[350px] bg-brand-gray-100 rounded-bento p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-gray-200 rounded-bento" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-brand-gray-200 rounded" />
              <div className="h-3 w-20 bg-brand-gray-200 rounded" />
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-brand-gray-200 rounded-bento" />
            ))}
          </div>
        </div>

        {/* AI Mentor Skeleton */}
        <div className="h-[350px] bg-brand-gray-50 border border-brand-gray-100 rounded-bento overflow-hidden flex flex-col">
          <div className="p-4 bg-brand-gray-200 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-gray-300 rounded-bento" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-brand-gray-300 rounded" />
              <div className="h-3 w-20 bg-brand-gray-300 rounded" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-brand-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-brand-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-brand-gray-200 rounded" />
                <div className="h-4 w-4/6 bg-brand-gray-200 rounded" />
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-brand-gray-100">
            <div className="h-10 bg-brand-gray-200 rounded-bento" />
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { cn } from '@/lib/utils';

interface CompareViewProps {
  groupedRoles: GroupedRoles[];
}

type TabType = 'skills' | 'responsibilities';

export function CompareView({ groupedRoles }: CompareViewProps) {
  const [fromRoleId, setFromRoleId] = useState<string | null>(null);
  const [toRoleId, setToRoleId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RoleComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>('skills');

  const animationKey = `${fromRoleId}-${toRoleId}`;

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
    <div className="min-h-screen bg-brand-gray-50">
      <header className="border-b border-brand-gray-200 bg-brand-white/80 backdrop-blur-sm sticky top-0 z-30">
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
              <SummaryCards comparison={comparison} />

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

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-3 bg-brand-white rounded-bento border border-brand-gray-200 shadow-bento overflow-hidden">
                  <div className="flex border-b border-brand-gray-200">
                    <TabButton active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={TrendingUp} label="Skills" count={comparison.skillComparisons.filter((s) => s.delta !== 0 || s.isNew).length} />
                    <TabButton active={activeTab === 'responsibilities'} onClick={() => setActiveTab('responsibilities')} icon={FileText} label="Responsibilities" count={comparison.responsibilityDiff.filter((r) => r.status !== 'unchanged').length} />
                  </div>

                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {activeTab === 'skills' ? (
                        <motion.div key="skills" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                          <SkillDeltaView skills={comparison.skillComparisons} animationKey={animationKey} />
                        </motion.div>
                      ) : (
                        <motion.div key="responsibilities" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                          <ResponsibilityDeltaView responsibilities={comparison.responsibilityDiff} animationKey={animationKey} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {comparison.softSkillComparisons.some((s) => s.status !== 'unchanged') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-brand-white rounded-bento border border-brand-gray-200 p-6 shadow-bento">
                  <h3 className="text-lg font-semibold text-brand-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-gray-800" />
                    Soft Skills Changes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {comparison.softSkillComparisons.filter((s) => s.status !== 'unchanged').map((skill) => (
                      <motion.span
                        key={skill.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                          skill.status === 'added' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                        )}
                      >
                        {skill.status === 'added' ? <Sparkles className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">−</span>}
                        {skill.name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action Cards - Bento Grid with AI Mentor */}
              <ActionCards
                comparison={comparison}
                fromRoleId={fromRoleId}
                toRoleId={toRoleId!}
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

function SummaryCards({ comparison }: { comparison: RoleComparisonResult }) {
  const { summary } = comparison;

  const cards: Array<{
    label: string;
    value: number | string;
    icon: typeof TrendingUp;
    bgColor: string;
    description: string;
  }> = [
    { label: 'Skill Upgrades', value: summary.totalSkillUpgrades, icon: TrendingUp, bgColor: 'bg-brand-gray-900', description: `Avg +${summary.averageLevelIncrease} levels` },
    { label: 'New Skills', value: summary.totalNewSkills, icon: Sparkles, bgColor: 'bg-brand-gray-800', description: 'To learn' },
    { label: 'New Tasks', value: summary.newResponsibilities, icon: FileText, bgColor: 'bg-brand-accent', description: 'Responsibilities' },
  ];

  if (summary.leadershipChange !== 'none') {
    cards.push({
      label: 'Leadership',
      value: summary.leadershipChange === 'gained' ? '✓' : summary.leadershipChange === 'upgraded' ? '↑' : '−',
      icon: Users,
      bgColor: 'bg-brand-gray-700',
      description: summary.leadershipChange === 'gained' ? 'New leadership role' : summary.leadershipChange === 'upgraded' ? 'Leadership upgrade' : 'Leadership removed',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative group">
          <div className="bg-brand-white border border-brand-gray-200 rounded-bento p-5 hover:shadow-bento-hover transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-bento flex items-center justify-center', card.bgColor)}>
                <card.icon className="w-5 h-5 text-brand-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-brand-gray-900 font-mono mb-1">{card.value}</div>
            <div className="text-sm font-medium text-brand-gray-600">{card.label}</div>
            <div className="text-xs text-brand-gray-400 mt-1">{card.description}</div>
          </div>
        </motion.div>
      ))}
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

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  ArrowDown,
  Sparkles,
  Minus,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import type { SkillComparison } from '@/lib/services/career-logic';
import { cn } from '@/lib/utils';

interface SkillDeltaViewProps {
  skills: SkillComparison[];
  animationKey?: string;
}

const LEVEL_NAMES = ['None', 'Learner', 'Practitioner', 'Expert', 'Master'];

// Convidera Skill Level Colors
const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-brand-gray-100', text: 'text-brand-gray-500', border: 'border-brand-gray-200' },
  1: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  2: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  4: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'upgrades' | 'new' | 'removed';

export function SkillDeltaView({ skills, animationKey }: SkillDeltaViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filter, setFilter] = useState<FilterMode>('all');

  const counts = useMemo(() => {
    return {
      upgrades: skills.filter((s) => s.delta > 0 && !s.isNew).length,
      new: skills.filter((s) => s.isNew).length,
      removed: skills.filter((s) => s.isRemoved).length,
    };
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let result = skills;

    switch (filter) {
      case 'upgrades':
        result = skills.filter((s) => s.delta > 0 && !s.isNew);
        break;
      case 'new':
        result = skills.filter((s) => s.isNew);
        break;
      case 'removed':
        result = skills.filter((s) => s.isRemoved);
        break;
      default:
        result = skills.filter((s) => s.delta !== 0 || s.isNew || s.isRemoved);
    }

    return result.sort((a, b) => {
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      if (a.isRemoved && !b.isRemoved) return 1;
      if (!a.isRemoved && b.isRemoved) return -1;
      return b.delta - a.delta;
    });
  }, [skills, filter]);

  const groupedSkills = useMemo(() => {
    return filteredSkills.reduce((acc, skill) => {
      const field = skill.competenceFieldName;
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(skill);
      return acc;
    }, {} as Record<string, SkillComparison[]>);
  }, [filteredSkills]);

  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-gray-100 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-brand-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-brand-gray-700">No Skills to Compare</h3>
        <p className="text-brand-gray-400 mt-1">Select roles to see skill differences</p>
      </div>
    );
  }

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <FilterPill active={filter === 'all'} onClick={() => setFilter('all')}>
            All Changes
          </FilterPill>
          <FilterPill
            active={filter === 'upgrades'}
            onClick={() => setFilter('upgrades')}
            count={counts.upgrades}
            color="accent"
          >
            Upgrades
          </FilterPill>
          <FilterPill
            active={filter === 'new'}
            onClick={() => setFilter('new')}
            count={counts.new}
            color="green"
          >
            New Skills
          </FilterPill>
          {counts.removed > 0 && (
            <FilterPill
              active={filter === 'removed'}
              onClick={() => setFilter('removed')}
              count={counts.removed}
              color="red"
            >
              Removed
            </FilterPill>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-brand-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'list'
                ? 'bg-brand-white shadow-sm text-brand-gray-900'
                : 'text-brand-gray-400 hover:text-brand-gray-700'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'grid'
                ? 'bg-brand-white shadow-sm text-brand-gray-900'
                : 'text-brand-gray-400 hover:text-brand-gray-700'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {viewMode === 'list' ? (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([fieldName, fieldSkills], groupIndex) => (
              <motion.div
                key={fieldName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <h4 className="text-sm font-semibold text-brand-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-gray-800" />
                  {fieldName}
                </h4>
                <div className="space-y-2">
                  {fieldSkills.map((skill, index) => (
                    <SkillListItem key={skill.skillId} skill={skill} index={index} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSkills.map((skill, index) => (
              <SkillGridItem key={skill.skillId} skill={skill} index={index} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {filteredSkills.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-brand-gray-400"
        >
          No skills match the current filter
        </motion.div>
      )}
    </motion.div>
  );
}

function SkillListItem({ skill, index }: { skill: SkillComparison; index: number }) {
  const fromColors = LEVEL_COLORS[skill.fromLevel] || LEVEL_COLORS[0];
  const toColors = LEVEL_COLORS[skill.toLevel] || LEVEL_COLORS[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'group flex items-center gap-4 p-4 rounded-bento border hover-lift skill-card',
        skill.isNew
          ? 'bg-green-50/50 border-green-200'
          : skill.isRemoved
          ? 'bg-red-50/50 border-red-200'
          : skill.delta > 0
          ? 'bg-brand-white border-brand-gray-200'
          : 'bg-brand-gray-50 border-brand-gray-200'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-medium truncate',
              skill.isRemoved ? 'text-brand-gray-400 line-through' : 'text-brand-gray-900'
            )}
          >
            {skill.skillName}
          </span>
          {skill.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <Sparkles className="w-3 h-3" />
              New
            </span>
          )}
          {skill.isRemoved && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <Minus className="w-3 h-3" />
              Removed
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium font-mono border',
            fromColors.bg,
            fromColors.text,
            fromColors.border
          )}
        >
          <span className="hidden sm:inline">{LEVEL_NAMES[skill.fromLevel]}</span>
          <span className="sm:hidden">L{skill.fromLevel}</span>
        </div>

        <ChevronRight
          className={cn(
            'w-5 h-5 shrink-0',
            skill.delta > 0
              ? 'text-brand-accent'
              : skill.delta < 0
              ? 'text-red-400'
              : 'text-brand-gray-300'
          )}
        />

        <div
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium font-mono border',
            toColors.bg,
            toColors.text,
            toColors.border
          )}
        >
          <span className="hidden sm:inline">{LEVEL_NAMES[skill.toLevel]}</span>
          <span className="sm:hidden">L{skill.toLevel}</span>
        </div>

        <div
          className={cn(
            'w-10 h-10 rounded-bento flex items-center justify-center text-sm font-bold font-mono',
            skill.delta > 0
              ? 'bg-brand-accent/10 text-brand-accent'
              : skill.delta < 0
              ? 'bg-red-100 text-red-600'
              : 'bg-brand-gray-100 text-brand-gray-400'
          )}
        >
          {skill.delta > 0 ? (
            <span className="flex items-center">
              <ArrowUp className="w-3 h-3 mr-0.5" />
              {skill.delta}
            </span>
          ) : skill.delta < 0 ? (
            <span className="flex items-center">
              <ArrowDown className="w-3 h-3 mr-0.5" />
              {Math.abs(skill.delta)}
            </span>
          ) : (
            '='
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SkillGridItem({ skill, index }: { skill: SkillComparison; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'relative p-4 rounded-bento border hover-lift skill-card',
        skill.isNew
          ? 'bg-green-50 border-green-200'
          : skill.isRemoved
          ? 'bg-red-50 border-red-200'
          : 'bg-brand-white border-brand-gray-200'
      )}
    >
      {skill.delta !== 0 && (
        <div
          className={cn(
            'absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shadow-sm',
            skill.delta > 0
              ? 'bg-brand-gray-900 text-brand-white'
              : 'bg-red-500 text-brand-white'
          )}
        >
          {skill.delta > 0 ? `+${skill.delta}` : skill.delta}
        </div>
      )}

      {(skill.isNew || skill.isRemoved) && (
        <div
          className={cn(
            'absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm',
            skill.isNew
              ? 'bg-green-600 text-brand-white'
              : 'bg-red-500 text-brand-white'
          )}
        >
          {skill.isNew ? 'NEW' : 'DEL'}
        </div>
      )}

      <h4
        className={cn(
          'font-medium text-sm mb-3 line-clamp-2',
          skill.isRemoved ? 'text-brand-gray-400' : 'text-brand-gray-900'
        )}
      >
        {skill.skillName}
      </h4>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'flex-1 h-2 rounded-full transition-all',
              level <= skill.toLevel
                ? skill.isRemoved
                  ? 'bg-red-300'
                  : level <= skill.fromLevel
                  ? 'bg-brand-gray-800'
                  : 'bg-brand-accent'
                : 'bg-brand-gray-200'
            )}
          />
        ))}
      </div>

      <div className="mt-2 text-xs text-brand-gray-400 font-mono">
        L{skill.fromLevel} → L{skill.toLevel}
      </div>
    </motion.div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  count,
  color = 'default',
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
  color?: 'default' | 'accent' | 'green' | 'red';
}) {
  const colorStyles = {
    default: active ? 'bg-brand-gray-900 text-brand-white' : 'bg-brand-white hover:bg-brand-gray-50',
    accent: active ? 'bg-brand-accent text-brand-white' : 'bg-brand-white hover:bg-blue-50 text-brand-accent',
    green: active ? 'bg-green-600 text-brand-white' : 'bg-brand-white hover:bg-green-50 text-green-700',
    red: active ? 'bg-red-500 text-brand-white' : 'bg-brand-white hover:bg-red-50 text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-brand-gray-200 transition-all',
        colorStyles[color]
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'px-1.5 rounded-full text-xs font-mono',
            active ? 'bg-white/20' : 'bg-brand-gray-100'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

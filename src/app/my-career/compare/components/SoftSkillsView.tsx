'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Check,
  Filter,
  Users,
  Sparkles,
} from 'lucide-react';
import type { SoftSkillComparison } from '@/lib/services/career-logic';
import { cn } from '@/lib/utils';

interface SoftSkillsViewProps {
  softSkills: SoftSkillComparison[];
  animationKey?: string;
  onAskMentor?: (message: string) => void;
}

type FilterType = 'all' | 'added' | 'removed' | 'unchanged';

const statusConfig = {
  added: {
    icon: Plus,
    label: 'New',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    badgeColor: 'bg-green-100 text-green-700',
  },
  removed: {
    icon: Minus,
    label: 'Removed',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-100 text-red-700',
  },
  unchanged: {
    icon: Check,
    label: 'Unchanged',
    bgColor: 'bg-brand-gray-50',
    borderColor: 'border-brand-gray-200',
    iconColor: 'text-brand-gray-400',
    badgeColor: 'bg-brand-gray-100 text-brand-gray-600',
  },
};

export function SoftSkillsView({
  softSkills,
  animationKey,
  onAskMentor,
}: SoftSkillsViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const statusCounts = useMemo(() => {
    return softSkills.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [softSkills]);

  const filteredSkills = useMemo(() => {
    if (filter === 'all') return softSkills;
    return softSkills.filter((s) => s.status === filter);
  }, [softSkills, filter]);

  const groupedByCategory = useMemo(() => {
    return filteredSkills.reduce((acc, skill) => {
      const category = skill.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, SoftSkillComparison[]>);
  }, [filteredSkills]);

  if (softSkills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-gray-100 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-brand-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-brand-gray-700">
          No Soft Skills to Compare
        </h3>
        <p className="text-brand-gray-400 mt-1">
          Select roles to see soft skill differences
        </p>
      </div>
    );
  }

  const addedSkills = softSkills.filter((s) => s.status === 'added');

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-brand-gray-400 mr-2">
          <Filter className="w-4 h-4" />
          Filter:
        </div>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          count={softSkills.length}
        >
          All
        </FilterButton>
        <FilterButton
          active={filter === 'added'}
          onClick={() => setFilter('added')}
          count={statusCounts.added || 0}
          variant="success"
        >
          New
        </FilterButton>
        <FilterButton
          active={filter === 'removed'}
          onClick={() => setFilter('removed')}
          count={statusCounts.removed || 0}
          variant="danger"
        >
          Removed
        </FilterButton>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedByCategory).map(([category, skills], groupIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: groupIndex * 0.05 }}
            >
              <h4 className="text-sm font-semibold text-brand-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-gray-800" />
                {category}
              </h4>
              <div className="space-y-2">
                {skills.map((skill, index) => (
                  <SoftSkillItem key={skill.id} skill={skill} index={index} />
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSkills.length === 0 && filter !== 'all' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-brand-gray-400"
        >
          No {filter} soft skills found
        </motion.div>
      )}

      {onAskMentor && addedSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-4 border-t border-white/30"
        >
          <button
            onClick={() =>
              onAskMentor(
                `Wie kann ich diese Soft Skills entwickeln: ${addedSkills
                  .map((s) => s.name)
                  .slice(0, 5)
                  .join(', ')}?`
              )
            }
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-accent to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Soft Skills entwickeln
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function SoftSkillItem({
  skill,
  index,
}: {
  skill: SoftSkillComparison;
  index: number;
}) {
  const config = statusConfig[skill.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-bento border hover-lift',
        config.bgColor,
        config.borderColor
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          skill.status === 'added'
            ? 'bg-green-100'
            : skill.status === 'removed'
            ? 'bg-red-100'
            : 'bg-brand-gray-100'
        )}
      >
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm font-medium',
            skill.status === 'removed'
              ? 'text-brand-gray-400 line-through'
              : 'text-brand-gray-700'
          )}
        >
          {skill.name}
        </span>
      </div>

      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
          config.badgeColor
        )}
      >
        {config.label}
      </span>
    </motion.div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
  count,
  variant = 'default',
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: 'default' | 'success' | 'danger';
}) {
  const variantStyles = {
    default: active
      ? 'bg-brand-gray-900 text-brand-white'
      : 'bg-brand-white text-brand-gray-600 hover:bg-brand-gray-50',
    success: active
      ? 'bg-green-600 text-brand-white'
      : 'bg-brand-white text-green-600 hover:bg-green-50',
    danger: active
      ? 'bg-red-500 text-brand-white'
      : 'bg-brand-white text-red-600 hover:bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
        variantStyles[variant],
        active ? 'border-transparent' : 'border-brand-gray-200'
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs font-mono',
            active
              ? 'bg-white/20'
              : variant === 'success'
              ? 'bg-green-100'
              : variant === 'danger'
              ? 'bg-red-100'
              : 'bg-brand-gray-100'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

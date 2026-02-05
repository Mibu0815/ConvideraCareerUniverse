'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Info,
  Minus,
  Check,
  Filter,
  ChevronDown,
  Briefcase,
  Target,
  Cog,
  Users,
} from 'lucide-react';
import type { ResponsibilityDiff } from '@/lib/services/career-logic';
import { cn } from '@/lib/utils';

interface ResponsibilityDeltaViewProps {
  responsibilities: ResponsibilityDiff[];
  animationKey?: string;
}

type FilterType = 'all' | 'added' | 'removed' | 'modified' | 'unchanged';

const categoryIcons: Record<string, typeof Briefcase> = {
  Leadership: Users,
  Technical: Cog,
  Strategic: Target,
  Operational: Briefcase,
  General: Briefcase,
};

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
  modified: {
    icon: Info,
    label: 'Modified',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconColor: 'text-amber-600',
    badgeColor: 'bg-amber-100 text-amber-700',
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

export function ResponsibilityDeltaView({
  responsibilities,
  animationKey,
}: ResponsibilityDeltaViewProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Leadership', 'Technical', 'Strategic', 'Operational', 'General'])
  );

  const statusCounts = useMemo(() => {
    return responsibilities.reduce(
      (acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [responsibilities]);

  const filteredResponsibilities = useMemo(() => {
    if (filter === 'all') return responsibilities;
    return responsibilities.filter((r) => r.status === filter);
  }, [responsibilities, filter]);

  const groupedByCategory = useMemo(() => {
    return filteredResponsibilities.reduce((acc, resp) => {
      const category = resp.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(resp);
      return acc;
    }, {} as Record<string, ResponsibilityDiff[]>);
  }, [filteredResponsibilities]);

  const sortedCategories = ['Leadership', 'Strategic', 'Technical', 'Operational', 'General'].filter(
    (c) => groupedByCategory[c]?.length > 0
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (responsibilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-gray-100 flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-brand-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-brand-gray-700">
          No Responsibilities Found
        </h3>
        <p className="text-brand-gray-400 mt-1">
          Select roles to compare responsibilities
        </p>
      </div>
    );
  }

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
          count={responsibilities.length}
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
          active={filter === 'modified'}
          onClick={() => setFilter('modified')}
          count={statusCounts.modified || 0}
          variant="warning"
        >
          Modified
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

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {sortedCategories.map((category, categoryIndex) => {
            const CategoryIcon = categoryIcons[category] || Briefcase;
            const isExpanded = expandedCategories.has(category);
            const items = groupedByCategory[category];

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: categoryIndex * 0.05 }}
                className="border border-brand-gray-200 rounded-bento overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-brand-gray-50 hover:bg-brand-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        category === 'Leadership'
                          ? 'bg-purple-100'
                          : category === 'Strategic'
                          ? 'bg-brand-accent/10'
                          : category === 'Technical'
                          ? 'bg-green-100'
                          : 'bg-brand-gray-200'
                      )}
                    >
                      <CategoryIcon
                        className={cn(
                          'w-4 h-4',
                          category === 'Leadership'
                            ? 'text-purple-600'
                            : category === 'Strategic'
                            ? 'text-brand-accent'
                            : category === 'Technical'
                            ? 'text-green-600'
                            : 'text-brand-gray-600'
                        )}
                      />
                    </div>
                    <span className="font-semibold text-brand-gray-700">{category}</span>
                    <span className="text-sm text-brand-gray-400">
                      ({items.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-brand-gray-400 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-2">
                        {items.map((resp, index) => (
                          <ResponsibilityItem
                            key={resp.id}
                            responsibility={resp}
                            index={index}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredResponsibilities.length === 0 && filter !== 'all' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-brand-gray-400"
        >
          No {filter} responsibilities found
        </motion.div>
      )}
    </motion.div>
  );
}

function ResponsibilityItem({
  responsibility,
  index,
}: {
  responsibility: ResponsibilityDiff;
  index: number;
}) {
  const config = statusConfig[responsibility.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-bento border hover-lift responsibility-card',
        config.bgColor,
        config.borderColor
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          responsibility.status === 'added'
            ? 'bg-green-100'
            : responsibility.status === 'removed'
            ? 'bg-red-100'
            : responsibility.status === 'modified'
            ? 'bg-amber-100'
            : 'bg-brand-gray-100'
        )}
      >
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-relaxed',
            responsibility.status === 'removed'
              ? 'text-brand-gray-400 line-through'
              : 'text-brand-gray-700'
          )}
        >
          {responsibility.text}
        </p>

        {responsibility.status === 'modified' && responsibility.similarity && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-brand-gray-200 rounded-full overflow-hidden max-w-[100px]">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${responsibility.similarity * 100}%` }}
              />
            </div>
            <span className="text-xs text-brand-gray-400">
              {Math.round(responsibility.similarity * 100)}% similar
            </span>
          </div>
        )}
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
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: active
      ? 'bg-brand-gray-900 text-brand-white'
      : 'bg-brand-white text-brand-gray-600 hover:bg-brand-gray-50',
    success: active
      ? 'bg-green-600 text-brand-white'
      : 'bg-brand-white text-green-600 hover:bg-green-50',
    warning: active
      ? 'bg-amber-500 text-brand-white'
      : 'bg-brand-white text-amber-600 hover:bg-amber-50',
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
              : variant === 'warning'
              ? 'bg-amber-100'
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

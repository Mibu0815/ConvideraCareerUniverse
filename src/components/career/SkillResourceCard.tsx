'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Cpu,
  Building2,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillResourceCardProps {
  skillId: string;
  skillName: string;
  competenceFieldName: string;
  currentLevel: number;
  targetLevel: number;
  delta: number;
  // AI Content fields
  coreDescription?: string | null;
  aiLayerDescription?: string | null;
  aiToolTip?: string | null;
  realWorldCaseLink?: string | null;
  realWorldExpert?: string | null;
  // Actions
  onFocus?: () => void;
  isFocused?: boolean;
}

const LEVEL_NAMES = ['None', 'Learner', 'Practitioner', 'Expert', 'Master'];

export function SkillResourceCard({
  skillName,
  competenceFieldName,
  currentLevel,
  targetLevel,
  delta,
  coreDescription,
  aiLayerDescription,
  aiToolTip,
  realWorldCaseLink,
  realWorldExpert,
  onFocus,
  isFocused,
}: SkillResourceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate placeholder content if not provided
  const core = coreDescription || `Grundlagen von ${skillName} im Convidera-Kontext verstehen und anwenden.`;
  const aiLayer = aiLayerDescription || `Nutze Claude Code oder GitHub Copilot, um ${skillName}-Aufgaben zu beschleunigen.`;
  const toolTip = aiToolTip || 'Claude Code, Copilot, oder Cursor';
  const expert = realWorldExpert || 'Frag deinen Functional Lead';

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl border overflow-hidden transition-all',
        isFocused
          ? 'border-convidera-blue/30 bg-convidera-blue/5'
          : 'border-brand-gray-200 bg-white',
        'hover:shadow-lg hover:shadow-brand-gray-100/50'
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-brand-gray-900 truncate">
              {skillName}
            </span>
            {isFocused && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-convidera-blue/10 text-convidera-blue">
                <Target className="w-3 h-3" />
                Fokus
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-gray-500">
            <span>{competenceFieldName}</span>
            <span className="text-brand-gray-300">•</span>
            <span className="font-mono">
              L{currentLevel} → L{targetLevel}
            </span>
            {delta > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-convidera-blue/10 text-convidera-blue text-xs font-bold">
                +{delta}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-brand-gray-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Expandable Content - Three Layers */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Core Layer */}
              <div className="p-3 rounded-xl bg-brand-gray-50 border border-brand-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-brand-gray-200 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 text-brand-gray-600" />
                  </div>
                  <span className="text-xs font-semibold text-brand-gray-500 uppercase tracking-wide">
                    Core (2020 Basis)
                  </span>
                </div>
                <p className="text-sm text-brand-gray-700 leading-relaxed">
                  {core}
                </p>
              </div>

              {/* AI Layer */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-convidera-blue/5 to-purple-50 border border-convidera-blue/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-convidera-blue/10 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-convidera-blue" />
                  </div>
                  <span className="text-xs font-semibold text-convidera-blue uppercase tracking-wide">
                    AI-Layer (2026 Upgrade)
                  </span>
                  <Sparkles className="w-3 h-3 text-convidera-blue/60" />
                </div>
                <p className="text-sm text-brand-gray-700 leading-relaxed mb-2">
                  {aiLayer}
                </p>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/80 text-xs text-brand-gray-600">
                  <Cpu className="w-3 h-3" />
                  <span>Tool-Tipp: {toolTip}</span>
                </div>
              </div>

              {/* Real-World Case */}
              <div className="p-3 rounded-xl bg-green-50/50 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Real-World Case
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-brand-gray-700">{expert}</span>
                </div>
                {realWorldCaseLink && (
                  <a
                    href={realWorldCaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-white text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Repo ansehen
                  </a>
                )}
              </div>

              {/* Focus Button */}
              {onFocus && !isFocused && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocus();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-convidera-blue text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-convidera-blue/90 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  Als Lernziel fokussieren
                </button>
              )}

              {isFocused && (
                <div className="py-2.5 px-4 rounded-xl bg-green-100 text-green-700 font-medium text-sm flex items-center justify-center gap-2">
                  <Target className="w-4 h-4" />
                  Bereits fokussiert
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

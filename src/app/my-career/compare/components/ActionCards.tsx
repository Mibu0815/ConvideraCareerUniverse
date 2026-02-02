'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import type { RoleComparisonResult, SkillComparison, ResponsibilityDiff } from '@/lib/services';
import { cn } from '@/lib/utils';

// Convidera Skill Level Colors
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-green-50 text-green-700 border-green-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
  4: 'bg-purple-50 text-purple-700 border-purple-200',
};

interface ActionCardsProps {
  comparison: RoleComparisonResult;
  fromRoleId: string | null;
  toRoleId: string;
}

export function ActionCards({ comparison, fromRoleId, toRoleId }: ActionCardsProps) {
  const skillUpgrades = comparison.skillComparisons.filter(s => s.delta > 0 && !s.isNew);
  const newSkills = comparison.skillComparisons.filter(s => s.isNew);
  const newResponsibilities = comparison.responsibilityDiff.filter(r => r.status === 'added');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="grid lg:grid-cols-3 gap-6"
    >
      <SkillUpgradesCard skills={[...skillUpgrades, ...newSkills]} />
      <NewResponsibilitiesCard responsibilities={newResponsibilities} />
      <AIMentorCard fromRoleId={fromRoleId} toRoleId={toRoleId} comparison={comparison} />
    </motion.div>
  );
}

// ============================================================================
// SKILL UPGRADES CARD
// ============================================================================

function SkillUpgradesCard({ skills }: { skills: SkillComparison[] }) {
  const [showAll, setShowAll] = useState(false);
  const displaySkills = showAll ? skills : skills.slice(0, 5);

  return (
    <div className="bg-brand-white rounded-bento border border-brand-gray-200 shadow-bento overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-bento bg-brand-gray-900 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-brand-white" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-gray-900">Skill Upgrades</h3>
          <p className="text-sm text-brand-gray-400">{skills.length} skills to develop</p>
        </div>
      </div>

      <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
        <AnimatePresence>
          {displaySkills.map((skill, index) => (
            <motion.div
              key={skill.skillId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-bento bg-brand-gray-50 hover:bg-brand-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-brand-gray-800 truncate">{skill.skillName}</div>
                <div className="text-xs text-brand-gray-400">{skill.competenceFieldName}</div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {skill.isNew ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    New → L{skill.toLevel}
                  </span>
                ) : (
                  <>
                    <span className={cn('px-2 py-0.5 rounded-md text-xs font-mono font-medium border', LEVEL_COLORS[skill.fromLevel] || 'bg-brand-gray-100')}>
                      L{skill.fromLevel}
                    </span>
                    <ChevronRight className="w-4 h-4 text-brand-accent" />
                    <span className={cn('px-2 py-0.5 rounded-md text-xs font-mono font-medium border', LEVEL_COLORS[skill.toLevel] || 'bg-brand-gray-100')}>
                      L{skill.toLevel}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {skills.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm font-medium text-brand-accent hover:text-blue-700 transition-colors"
          >
            {showAll ? 'Show less' : `Show ${skills.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NEW RESPONSIBILITIES CARD
// ============================================================================

function NewResponsibilitiesCard({ responsibilities }: { responsibilities: ResponsibilityDiff[] }) {
  const [showAll, setShowAll] = useState(false);
  const displayResponsibilities = showAll ? responsibilities : responsibilities.slice(0, 4);

  return (
    <div className="bg-brand-white rounded-bento border border-brand-gray-200 shadow-bento overflow-hidden">
      <div className="px-5 py-4 border-b border-brand-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-bento bg-brand-accent flex items-center justify-center">
          <FileText className="w-5 h-5 text-brand-white" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-gray-900">New Responsibilities</h3>
          <p className="text-sm text-brand-gray-400">{responsibilities.length} new tasks</p>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
        <AnimatePresence>
          {displayResponsibilities.map((resp, index) => (
            <motion.div
              key={resp.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-bento bg-brand-gray-50"
            >
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-green-700" />
              </div>
              <p className="text-sm text-brand-gray-700 leading-relaxed">{resp.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {responsibilities.length === 0 && (
          <div className="text-center py-8 text-brand-gray-400 text-sm">
            No new responsibilities in this transition
          </div>
        )}

        {responsibilities.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-2 text-sm font-medium text-brand-accent hover:text-blue-700 transition-colors"
          >
            {showAll ? 'Show less' : `Show ${responsibilities.length - 4} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AI MENTOR CARD (Glassmorphism)
// ============================================================================

interface MentorMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Extract keywords from comparison for highlighting
function extractKeywords(comparison: RoleComparisonResult): {
  skills: string[];
  competenceFields: string[];
  levels: string[];
} {
  const skills = comparison.skillComparisons
    .filter((s) => s.delta > 0 || s.isNew)
    .map((s) => s.skillName);

  const competenceFields = [...new Set(
    comparison.skillComparisons.map((s) => s.competenceFieldName)
  )];

  const levels = ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'L1', 'L2', 'L3', 'L4', 'Learner', 'Practitioner', 'Expert', 'Master'];

  return { skills, competenceFields, levels };
}

// Highlight keywords in text
function HighlightedText({
  content,
  keywords,
}: {
  content: string;
  keywords: { skills: string[]; competenceFields: string[]; levels: string[] };
}) {
  // Build regex pattern for all keywords
  const allPatterns: { pattern: RegExp; className: string }[] = [];

  // Skills (highest priority)
  keywords.skills.forEach((skill) => {
    if (skill.length > 2) {
      allPatterns.push({
        pattern: new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
        className: 'skill-highlight',
      });
    }
  });

  // Competence fields
  keywords.competenceFields.forEach((field) => {
    if (field.length > 2) {
      allPatterns.push({
        pattern: new RegExp(`\\b${field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
        className: 'competence-highlight',
      });
    }
  });

  // Levels
  keywords.levels.forEach((level) => {
    allPatterns.push({
      pattern: new RegExp(`\\b${level.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'),
      className: 'level-highlight',
    });
  });

  // Process content and create highlighted spans
  let result: (string | JSX.Element)[] = [content];

  allPatterns.forEach(({ pattern, className }, patternIndex) => {
    result = result.flatMap((part, partIndex) => {
      if (typeof part !== 'string') return part;

      const segments: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(part)) !== null) {
        if (match.index > lastIndex) {
          segments.push(part.slice(lastIndex, match.index));
        }
        segments.push(
          <span key={`${patternIndex}-${partIndex}-${match.index}`} className={className}>
            {match[0]}
          </span>
        );
        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < part.length) {
        segments.push(part.slice(lastIndex));
      }

      return segments.length > 0 ? segments : [part];
    });
  });

  return <>{result}</>;
}

function AIMentorCard({
  fromRoleId,
  toRoleId,
  comparison,
}: {
  fromRoleId: string | null;
  toRoleId: string;
  comparison: RoleComparisonResult;
}) {
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedGreeting, setHasLoadedGreeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract keywords for highlighting
  const keywords = useMemo(() => extractKeywords(comparison), [comparison]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load initial greeting/advice on mount
  useEffect(() => {
    if (hasLoadedGreeting) return;

    const loadInitialAdvice = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/career/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'advice',
            fromRoleId,
            toRoleId,
            message: 'Gib mir die 3 wichtigsten Empfehlungen für diesen Karriereschritt.',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([{ role: 'assistant', content: data.content }]);
        }
      } catch (error) {
        console.error('Failed to load mentor advice:', error);
        // Fallback: Show a generic greeting
        const fromName = comparison.fromRole?.name || 'Ihrem aktuellen Stand';
        const toName = comparison.toRole.name;
        setMessages([{
          role: 'assistant',
          content: `Ich analysiere Ihren Karriereweg von **${fromName}** zu **${toName}**.\n\nSie haben ${comparison.summary.totalSkillUpgrades} Skills zu entwickeln und ${comparison.summary.totalNewSkills} neue zu erlernen. Fragen Sie mich nach konkreten Empfehlungen!`,
        }]);
      } finally {
        setIsLoading(false);
        setHasLoadedGreeting(true);
      }
    };

    loadInitialAdvice();
  }, [fromRoleId, toRoleId, hasLoadedGreeting, comparison]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/career/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          fromRoleId,
          toRoleId,
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.' },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.' },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mentor-glass rounded-bento overflow-hidden flex flex-col relative">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="mentor-glass-header px-5 py-4 flex items-center gap-3 relative z-10">
        <div className="w-10 h-10 rounded-bento bg-gradient-to-br from-brand-accent to-purple-600 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-brand-white" />
        </div>
        <div>
          <h3 className="font-semibold text-brand-white">AI Career Mentor</h3>
          <p className="text-sm text-brand-gray-400">Powered by Claude</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
          <span className="text-xs text-brand-gray-300">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 max-h-[300px] overflow-y-auto relative z-10">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md',
                message.role === 'assistant'
                  ? 'bg-gradient-to-br from-brand-gray-800 to-brand-black'
                  : 'bg-gradient-to-br from-brand-gray-100 to-brand-gray-200'
              )}
            >
              {message.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-brand-white" />
              ) : (
                <User className="w-4 h-4 text-brand-gray-600" />
              )}
            </div>
            <div
              className={cn(
                'rounded-bento px-4 py-3 max-w-[85%]',
                message.role === 'assistant'
                  ? 'mentor-message-glass text-brand-gray-700'
                  : 'bg-gradient-to-br from-brand-gray-800 to-brand-gray-900 text-brand-white shadow-lg'
              )}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.role === 'assistant' ? (
                  <HighlightedText content={message.content} keywords={keywords} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-gray-800 to-brand-black flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-brand-white" />
            </div>
            <div className="mentor-message-glass rounded-bento px-4 py-3">
              <div className="flex items-center gap-2 text-brand-gray-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm">Analysiert...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/20 bg-white/30 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Fragen Sie nach Karriereberatung..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-bento bg-white/80 backdrop-blur-sm border border-white/50 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm placeholder:text-brand-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-bento bg-gradient-to-br from-brand-gray-800 to-brand-black text-brand-white hover:from-brand-gray-700 hover:to-brand-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

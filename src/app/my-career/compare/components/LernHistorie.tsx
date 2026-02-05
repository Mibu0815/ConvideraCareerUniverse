'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, BookOpen, Calendar, MessageSquare, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletedImpulse {
  id: string;
  skillName: string;
  completedAt: Date | null;
  userReflection: string | null;
}

interface LernHistorieProps {
  completedImpulses: CompletedImpulse[];
  totalFocusedSkills?: number;
  className?: string;
}

export function LernHistorie({
  completedImpulses,
  totalFocusedSkills = 0,
  className,
}: LernHistorieProps) {
  if (completedImpulses.length === 0 && totalFocusedSkills === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-white rounded-bento border border-brand-gray-200 p-8 text-center',
          className
        )}
      >
        <div className="w-16 h-16 rounded-full bg-brand-gray-100 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-brand-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-brand-gray-800 mb-2">
          Deine Lern-Historie
        </h3>
        <p className="text-brand-gray-400 text-sm max-w-sm mx-auto">
          Markiere Skills als Lernziele, um hier deinen Fortschritt zu sehen. Abgeschlossene Impulse erscheinen hier.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-convidera-blue">
          <Target className="w-4 h-4" />
          <span>Klicke auf das Target-Icon bei einem Skill</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {/* Summary Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 md:col-span-1 bg-white border border-brand-gray-200 rounded-bento p-5 hover-lift"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-bento bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="text-3xl font-bold text-brand-gray-900 font-mono mb-1">
          {completedImpulses.length}
        </div>
        <div className="text-sm font-medium text-brand-gray-600">
          Impulse abgeschlossen
        </div>
        <div className="text-xs text-brand-gray-400 mt-1">
          {totalFocusedSkills} Skills fokussiert
        </div>
      </motion.div>

      {/* Active Focus Card */}
      {totalFocusedSkills > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-convidera-blue/5 to-purple-50 border border-convidera-blue/20 rounded-bento p-4 hover-lift"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-convidera-blue" />
            <span className="text-xs font-semibold text-convidera-blue uppercase tracking-wide">
              Aktiv
            </span>
          </div>
          <div className="text-2xl font-bold text-brand-gray-900 font-mono">
            {totalFocusedSkills}/3
          </div>
          <div className="text-sm text-brand-gray-600">Fokus-Slots belegt</div>
        </motion.div>
      )}

      {/* Recent Completed Impulses */}
      {completedImpulses.slice(0, totalFocusedSkills > 0 ? 2 : 3).map((impulse, index) => (
        <motion.div
          key={impulse.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (index + 1) * 0.05 }}
          className="bg-white border border-brand-gray-200 rounded-bento p-4 hover-lift"
        >
          <div className="flex items-start gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium text-brand-gray-800 line-clamp-2">
              {impulse.skillName}
            </span>
          </div>

          {impulse.userReflection && (
            <div className="flex items-start gap-1.5 mb-2">
              <MessageSquare className="w-3 h-3 text-brand-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-brand-gray-400 line-clamp-2 italic">
                &quot;{impulse.userReflection}&quot;
              </p>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-brand-gray-400">
            <Calendar className="w-3 h-3" />
            {impulse.completedAt
              ? new Date(impulse.completedAt).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: 'short',
                })
              : 'Datum unbekannt'}
          </div>
        </motion.div>
      ))}

      {/* Show more hint if there are more impulses */}
      {completedImpulses.length > 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-2 md:col-span-4 text-center py-2"
        >
          <span className="text-sm text-brand-gray-400">
            +{completedImpulses.length - 3} weitere abgeschlossene Impulse
          </span>
        </motion.div>
      )}
    </div>
  );
}

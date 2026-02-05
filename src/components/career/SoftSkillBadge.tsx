// components/career/SoftSkillBadge.tsx
'use client';

import { motion } from 'framer-motion';

interface SoftSkillBadgeProps {
  name: string;
  isRequired: boolean;
  currentLevel: number;
  targetLevel: number;
}

export const SoftSkillBadge = ({ name, isRequired, currentLevel, targetLevel }: SoftSkillBadgeProps) => {
  const isGap = currentLevel < targetLevel;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)' }}
      className={`
        relative p-4 rounded-2xl border transition-all duration-300
        ${isGap ? 'bg-yellow-50/30 border-yellow-200/50' : 'bg-convidera-blue/5 border-convidera-blue/20'}
        hover:shadow-md group cursor-default
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-convidera-dark/50">
          {isGap ? 'Growth Area' : 'Match'}
        </span>
        {isRequired && (
          <div className="w-2 h-2 rounded-full bg-convidera-blue animate-pulse" />
        )}
      </div>

      <h4 className="font-bold text-convidera-dark group-hover:text-convidera-blue transition-colors">
        {name}
      </h4>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step <= currentLevel ? 'bg-convidera-blue' : 'bg-convidera-dark/10'
            }`}
          />
        ))}
      </div>

      {isGap && targetLevel > 0 && (
        <div className="mt-2 text-xs text-convidera-dark/40">
          Ziel: Level {targetLevel}
        </div>
      )}
    </motion.div>
  );
};

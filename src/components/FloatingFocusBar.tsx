'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, ArrowRight, Brain, MessageCircle, ClipboardList, Award,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { useFocusSkill } from '@/context/FocusSkillContext';

// Design tokens
const C = {
  blue: '#0055FF',
  green: '#22c55e',
  dark: '#0A0A0B',
  textMuted: '#64748B',
};

// Step configuration
const STEP_INFO: Record<string, { label: string; nextAction: string; icon: typeof MessageCircle }> = {
  CHECK_IN: { label: 'Check-In', nextAction: 'Check-In durchführen', icon: MessageCircle },
  TASK: { label: 'Aufgabe', nextAction: 'Aufgabe bearbeiten', icon: ClipboardList },
  REFLECTION: { label: 'Reflexion', nextAction: 'Reflexion schreiben', icon: Brain },
  EVIDENCE: { label: 'Evidence', nextAction: 'Evidence speichern', icon: Award },
};

export function FloatingFocusBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeSkill, activeImpulse, isSoftSkill, hasActiveSkill, completedImpulsesCount } = useFocusSkill();
  const [isVisible, setIsVisible] = useState(false);

  // Hide on onboarding routes and when no active skill
  const isOnboarding = pathname?.startsWith('/onboarding') || pathname === '/auth/login' || pathname === '/auth/register';
  const shouldShow = hasActiveSkill && !isOnboarding;

  // Delay visibility for smooth entrance
  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);

  // Get current step info
  const currentStep = activeImpulse?.currentStep ?? null;
  const stepInfo = currentStep ? STEP_INFO[currentStep] : null;

  // Progress calculation (0-100)
  const getProgress = () => {
    if (!activeImpulse) return 0;
    switch (activeImpulse.currentStep) {
      case 'CHECK_IN': return 10;
      case 'TASK': return 40;
      case 'REFLECTION': return 70;
      case 'EVIDENCE': return 90;
      default: return 0;
    }
  };

  const progress = getProgress();

  // Color scheme based on skill type
  const bgColor = isSoftSkill
    ? 'rgba(34, 197, 94, 0.08)'
    : 'rgba(0, 85, 255, 0.08)';
  const accentColor = isSoftSkill ? C.green : C.blue;
  const borderColor = isSoftSkill
    ? 'rgba(34, 197, 94, 0.2)'
    : 'rgba(0, 85, 255, 0.2)';

  return (
    <AnimatePresence>
      {isVisible && activeSkill && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            mass: 1,
          }}
          className="fixed bottom-4 inset-x-4 md:left-auto md:right-4 md:w-auto md:max-w-md"
          style={{
            zIndex: 1000,
          }}
        >
          <div
            onClick={() => router.push('/learning-journey')}
            style={{
              background: bgColor,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${borderColor}`,
              borderRadius: '20px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
              fontFamily: "'Outfit', sans-serif",
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)';
              e.currentTarget.style.transform = 'scale(1.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Left: Progress indicator with Convidera "C" */}
            <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
              {/* Background circle */}
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: 'absolute' }}>
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={`${accentColor}20`}
                  strokeWidth="4"
                />
                {/* Progress arc */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 1.13} 113`}
                  transform="rotate(-90 22 22)"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              {/* Convidera "C" */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: C.dark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
              }}>c</div>
            </div>

            {/* Center: Skill info and status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Skill name with icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Target size={14} color={accentColor} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: C.dark,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {activeSkill.skillName}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: C.textMuted,
                  background: `${accentColor}15`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  L{activeSkill.currentLevel} → L{activeSkill.targetLevel}
                </span>
              </div>

              {/* Status text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {stepInfo ? (
                  <>
                    <stepInfo.icon size={12} color={C.textMuted} />
                    <span style={{ fontSize: '12px', color: C.textMuted }}>
                      Nächster Schritt: <span style={{ fontWeight: 500 }}>{stepInfo.nextAction}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={12} color={C.textMuted} />
                    <span style={{ fontSize: '12px', color: C.textMuted }}>
                      {completedImpulsesCount > 0
                        ? `${completedImpulsesCount} Impulse erledigt`
                        : 'Bereit für deinen ersten Impuls'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: CTA Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push('/learning-journey');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: accentColor,
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Zur Journey
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

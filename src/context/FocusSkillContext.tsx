'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { StructuredImpulse } from '@/types/practical-impulse';

// Helper to detect soft skills
function isSoftSkill(skillName: string): boolean {
  const softSkillPatterns = /stakeholder|kommunikation|feedback|präsentation|moderation|coaching|leadership|team|konflikt|verhandlung|empathie|negotiation|facilitation/i;
  return softSkillPatterns.test(skillName);
}

export interface FocusSkillData {
  skillId: string;
  skillName: string;
  competenceFieldName: string | null;
  currentLevel: number;
  targetLevel: number;
  learningFocusId: string;
}

export interface FocusSkillContextType {
  // Current active focus skill
  activeSkill: FocusSkillData | null;
  // All in-progress skills
  focusSkills: FocusSkillData[];
  // Active impulse if any
  activeImpulse: StructuredImpulse | null;
  // Derived state
  isSoftSkill: boolean;
  hasActiveSkill: boolean;
  // Stats
  completedImpulsesCount: number;
  // Actions
  setActiveSkill: (skill: FocusSkillData | null) => void;
  setFocusSkills: (skills: FocusSkillData[]) => void;
  setActiveImpulse: (impulse: StructuredImpulse | null) => void;
  setCompletedImpulsesCount: (count: number) => void;
  // Initialize from server data
  initializeFromServerData: (data: {
    inProgressSkills?: FocusSkillData[];
    activeImpulse?: StructuredImpulse | null;
    completedImpulsesCount?: number;
  }) => void;
}

const FocusSkillContext = createContext<FocusSkillContextType | undefined>(undefined);

interface FocusSkillProviderProps {
  children: ReactNode;
  initialSkills?: FocusSkillData[];
  initialActiveImpulse?: StructuredImpulse | null;
  initialCompletedCount?: number;
}

export function FocusSkillProvider({
  children,
  initialSkills = [],
  initialActiveImpulse = null,
  initialCompletedCount = 0,
}: FocusSkillProviderProps) {
  const [focusSkills, setFocusSkillsState] = useState<FocusSkillData[]>(initialSkills);
  const [activeImpulse, setActiveImpulseState] = useState<StructuredImpulse | null>(initialActiveImpulse);
  const [completedImpulsesCount, setCompletedImpulsesCountState] = useState(initialCompletedCount);

  // Active skill is the first focus skill (primary)
  const activeSkill = focusSkills[0] ?? null;
  const hasActiveSkill = !!activeSkill;
  const skillIsSoft = activeSkill ? isSoftSkill(activeSkill.skillName) : false;

  // Update state when initial props change
  useEffect(() => {
    if (initialSkills.length > 0) {
      setFocusSkillsState(initialSkills);
    }
  }, [initialSkills]);

  useEffect(() => {
    if (initialActiveImpulse !== undefined) {
      setActiveImpulseState(initialActiveImpulse);
    }
  }, [initialActiveImpulse]);

  useEffect(() => {
    setCompletedImpulsesCountState(initialCompletedCount);
  }, [initialCompletedCount]);

  const setActiveSkill = useCallback((skill: FocusSkillData | null) => {
    if (skill) {
      // Move the selected skill to the front
      setFocusSkillsState(prev => {
        const filtered = prev.filter(s => s.skillId !== skill.skillId);
        return [skill, ...filtered];
      });
    }
  }, []);

  const setFocusSkills = useCallback((skills: FocusSkillData[]) => {
    setFocusSkillsState(skills);
  }, []);

  const setActiveImpulse = useCallback((impulse: StructuredImpulse | null) => {
    setActiveImpulseState(impulse);
  }, []);

  const setCompletedImpulsesCount = useCallback((count: number) => {
    setCompletedImpulsesCountState(count);
  }, []);

  const initializeFromServerData = useCallback((data: {
    inProgressSkills?: FocusSkillData[];
    activeImpulse?: StructuredImpulse | null;
    completedImpulsesCount?: number;
  }) => {
    if (data.inProgressSkills) {
      setFocusSkillsState(data.inProgressSkills);
    }
    if (data.activeImpulse !== undefined) {
      setActiveImpulseState(data.activeImpulse);
    }
    if (data.completedImpulsesCount !== undefined) {
      setCompletedImpulsesCountState(data.completedImpulsesCount);
    }
  }, []);

  return (
    <FocusSkillContext.Provider
      value={{
        activeSkill,
        focusSkills,
        activeImpulse,
        isSoftSkill: skillIsSoft,
        hasActiveSkill,
        completedImpulsesCount,
        setActiveSkill,
        setFocusSkills,
        setActiveImpulse,
        setCompletedImpulsesCount,
        initializeFromServerData,
      }}
    >
      {children}
    </FocusSkillContext.Provider>
  );
}

export function useFocusSkill() {
  const context = useContext(FocusSkillContext);
  if (context === undefined) {
    throw new Error('useFocusSkill must be used within a FocusSkillProvider');
  }
  return context;
}

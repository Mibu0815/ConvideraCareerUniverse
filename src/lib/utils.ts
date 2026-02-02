import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSkillLevel(level: number): string {
  const labels = ['', 'Learner', 'Practitioner', 'Expert', 'Master'];
  return labels[level] || `Level ${level}`;
}

export function getSkillLevelColor(level: number): string {
  const colors = {
    1: 'bg-blue-100 text-blue-800 border-blue-200',
    2: 'bg-green-100 text-green-800 border-green-200',
    3: 'bg-amber-100 text-amber-800 border-amber-200',
    4: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}

export function getDeltaColor(delta: number): string {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function formatRoleLevel(level: string): string {
  const labels: Record<string, string> = {
    JUNIOR: 'Junior',
    PROFESSIONAL: 'Professional',
    SENIOR: 'Senior',
    FUNCTIONAL_LEAD: 'Functional Lead',
    HEAD_OF: 'Head of',
  };
  return labels[level] || level;
}

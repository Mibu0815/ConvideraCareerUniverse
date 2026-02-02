#!/bin/bash

# Career Universe 2.0 - Compare Feature Setup Script
# Run this from your project root: bash setup-compare.sh

set -e

echo "🚀 Setting up Career Universe Compare Feature..."

# Create directories
mkdir -p src/app/my-career/compare/components
mkdir -p src/lib/services

echo "📁 Directories created"

# ============================================
# 1. career-logic.ts
# ============================================
cat > src/lib/services/career-logic.ts << 'EOF'
// src/lib/services/career-logic.ts
import { prisma } from '@/lib/prisma';

export interface SkillComparison {
  skillId: string;
  skillName: string;
  skillSlug: string;
  competenceFieldId: string;
  competenceFieldName: string;
  competenceFieldColor: string | null;
  fromLevel: number;
  toLevel: number;
  delta: number;
  isNew: boolean;
  isRemoved: boolean;
}

export interface ResponsibilityDiff {
  id: string;
  text: string;
  category: string | null;
  status: 'added' | 'removed' | 'unchanged' | 'modified';
  similarity?: number;
}

export interface SoftSkillComparison {
  id: string;
  name: string;
  category: string | null;
  status: 'added' | 'removed' | 'unchanged';
}

export interface RadarChartData {
  competenceField: string;
  competenceFieldId: string;
  color: string;
  fromRole: number;
  toRole: number;
  maxLevel: number;
  skills: {
    name: string;
    fromLevel: number;
    toLevel: number;
  }[];
}

export interface RoleComparisonResult {
  fromRole: {
    id: string;
    name: string;
    level: string;
    leadershipType: string;
    team: string | null;
  } | null;
  toRole: {
    id: string;
    name: string;
    level: string;
    leadershipType: string;
    hasBudgetAuth: boolean;
    team: string | null;
    reportsTo: string | null;
  };
  skillComparisons: SkillComparison[];
  radarChartData: RadarChartData[];
  responsibilityDiff: ResponsibilityDiff[];
  softSkillComparisons: SoftSkillComparison[];
  summary: {
    totalSkillUpgrades: number;
    totalNewSkills: number;
    totalRemovedSkills: number;
    newResponsibilities: number;
    removedResponsibilities: number;
    leadershipChange: 'none' | 'gained' | 'upgraded' | 'lost';
    averageLevelIncrease: number;
  };
}

export async function compareRoles(
  fromRoleId: string | null,
  toRoleId: string
): Promise<RoleComparisonResult> {
  const toRole = await prisma.role.findUnique({
    where: { id: toRoleId },
    include: {
      occupationalField: true,
      roleSkills: {
        include: {
          skill: {
            include: {
              competenceField: true,
            },
          },
        },
      },
      roleSoftSkills: {
        include: {
          softSkill: true,
        },
      },
      responsibilities: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!toRole) {
    throw new Error(`Target role not found: ${toRoleId}`);
  }

  let fromRole = null;
  const fromRoleSkillsMap = new Map<string, { level: number; skillId: string }>();
  const fromResponsibilities: { id: string; text: string; category: string | null }[] = [];
  const fromSoftSkills = new Set<string>();

  if (fromRoleId) {
    fromRole = await prisma.role.findUnique({
      where: { id: fromRoleId },
      include: {
        occupationalField: true,
        roleSkills: {
          include: {
            skill: {
              include: {
                competenceField: true,
              },
            },
          },
        },
        roleSoftSkills: {
          include: {
            softSkill: true,
          },
        },
        responsibilities: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (fromRole) {
      fromRole.roleSkills.forEach((rs) => {
        fromRoleSkillsMap.set(rs.skillId, { level: rs.minLevel, skillId: rs.skillId });
      });
      fromRole.responsibilities.forEach((r) => {
        fromResponsibilities.push({ id: r.id, text: r.text, category: r.category });
      });
      fromRole.roleSoftSkills.forEach((rss) => {
        fromSoftSkills.add(rss.softSkillId);
      });
    }
  }

  const skillComparisons: SkillComparison[] = [];
  const competenceFieldAggregation = new Map<
    string,
    {
      id: string;
      name: string;
      color: string | null;
      fromLevels: number[];
      toLevels: number[];
      skills: { name: string; fromLevel: number; toLevel: number }[];
    }
  >();

  const processedSkillIds = new Set<string>();

  for (const toRoleSkill of toRole.roleSkills) {
    const skill = toRoleSkill.skill;
    const cf = skill.competenceField;
    processedSkillIds.add(skill.id);

    const fromLevel = fromRoleSkillsMap.get(skill.id)?.level ?? 0;
    const toLevel = toRoleSkill.minLevel;

    skillComparisons.push({
      skillId: skill.id,
      skillName: skill.name,
      skillSlug: skill.slug,
      competenceFieldId: cf.id,
      competenceFieldName: cf.name,
      competenceFieldColor: cf.color,
      fromLevel,
      toLevel,
      delta: toLevel - fromLevel,
      isNew: fromLevel === 0,
      isRemoved: false,
    });

    if (!competenceFieldAggregation.has(cf.id)) {
      competenceFieldAggregation.set(cf.id, {
        id: cf.id,
        name: cf.name,
        color: cf.color,
        fromLevels: [],
        toLevels: [],
        skills: [],
      });
    }
    const cfData = competenceFieldAggregation.get(cf.id)!;
    cfData.fromLevels.push(fromLevel);
    cfData.toLevels.push(toLevel);
    cfData.skills.push({ name: skill.name, fromLevel, toLevel });
  }

  if (fromRole) {
    for (const fromRoleSkill of fromRole.roleSkills) {
      if (!processedSkillIds.has(fromRoleSkill.skillId)) {
        const skill = fromRoleSkill.skill;
        const cf = skill.competenceField;

        skillComparisons.push({
          skillId: skill.id,
          skillName: skill.name,
          skillSlug: skill.slug,
          competenceFieldId: cf.id,
          competenceFieldName: cf.name,
          competenceFieldColor: cf.color,
          fromLevel: fromRoleSkill.minLevel,
          toLevel: 0,
          delta: -fromRoleSkill.minLevel,
          isNew: false,
          isRemoved: true,
        });
      }
    }
  }

  const radarChartData: RadarChartData[] = Array.from(competenceFieldAggregation.values()).map(
    (cf) => ({
      competenceField: cf.name,
      competenceFieldId: cf.id,
      color: cf.color || '#6366f1',
      fromRole: average(cf.fromLevels),
      toRole: average(cf.toLevels),
      maxLevel: 4,
      skills: cf.skills,
    })
  );

  const responsibilityDiff = calculateResponsibilityDiff(
    fromResponsibilities,
    toRole.responsibilities.map((r) => ({ id: r.id, text: r.text, category: r.category }))
  );

  const softSkillComparisons: SoftSkillComparison[] = [];
  const processedSoftSkillIds = new Set<string>();

  for (const toSoftSkill of toRole.roleSoftSkills) {
    const ss = toSoftSkill.softSkill;
    processedSoftSkillIds.add(ss.id);

    softSkillComparisons.push({
      id: ss.id,
      name: ss.name,
      category: ss.category,
      status: fromSoftSkills.has(ss.id) ? 'unchanged' : 'added',
    });
  }

  if (fromRole) {
    for (const fromSoftSkill of fromRole.roleSoftSkills) {
      if (!processedSoftSkillIds.has(fromSoftSkill.softSkillId)) {
        softSkillComparisons.push({
          id: fromSoftSkill.softSkill.id,
          name: fromSoftSkill.softSkill.name,
          category: fromSoftSkill.softSkill.category,
          status: 'removed',
        });
      }
    }
  }

  const skillUpgrades = skillComparisons.filter((s) => s.delta > 0 && !s.isNew);
  const newSkills = skillComparisons.filter((s) => s.isNew);
  const removedSkills = skillComparisons.filter((s) => s.isRemoved);
  const addedResponsibilities = responsibilityDiff.filter((r) => r.status === 'added');
  const removedResponsibilities = responsibilityDiff.filter((r) => r.status === 'removed');

  let leadershipChange: 'none' | 'gained' | 'upgraded' | 'lost' = 'none';
  const fromLeadership = fromRole?.leadershipType || 'NONE';
  const toLeadership = toRole.leadershipType;

  if (fromLeadership === 'NONE' && toLeadership !== 'NONE') {
    leadershipChange = 'gained';
  } else if (fromLeadership === 'FUNCTIONAL' && toLeadership === 'DISCIPLINARY') {
    leadershipChange = 'upgraded';
  } else if (fromLeadership !== 'NONE' && toLeadership === 'NONE') {
    leadershipChange = 'lost';
  }

  const positiveDelta = skillComparisons.filter((s) => s.delta > 0);
  const averageLevelIncrease =
    positiveDelta.length > 0
      ? positiveDelta.reduce((sum, s) => sum + s.delta, 0) / positiveDelta.length
      : 0;

  return {
    fromRole: fromRole
      ? {
          id: fromRole.id,
          name: fromRole.name,
          level: fromRole.level,
          leadershipType: fromRole.leadershipType,
          team: fromRole.team,
        }
      : null,
    toRole: {
      id: toRole.id,
      name: toRole.name,
      level: toRole.level,
      leadershipType: toRole.leadershipType,
      hasBudgetAuth: toRole.hasBudgetAuth,
      team: toRole.team,
      reportsTo: toRole.reportsTo,
    },
    skillComparisons,
    radarChartData,
    responsibilityDiff,
    softSkillComparisons,
    summary: {
      totalSkillUpgrades: skillUpgrades.length,
      totalNewSkills: newSkills.length,
      totalRemovedSkills: removedSkills.length,
      newResponsibilities: addedResponsibilities.length,
      removedResponsibilities: removedResponsibilities.length,
      leadershipChange,
      averageLevelIncrease: Math.round(averageLevelIncrease * 10) / 10,
    },
  };
}

export function calculateResponsibilityDiff(
  fromResponsibilities: { id: string; text: string; category: string | null }[],
  toResponsibilities: { id: string; text: string; category: string | null }[]
): ResponsibilityDiff[] {
  const results: ResponsibilityDiff[] = [];
  const matchedFromIds = new Set<string>();

  for (const toResp of toResponsibilities) {
    let bestMatch: { id: string; similarity: number } | null = null;

    for (const fromResp of fromResponsibilities) {
      if (matchedFromIds.has(fromResp.id)) continue;

      const similarity = calculateSimilarity(
        normalizeText(fromResp.text),
        normalizeText(toResp.text)
      );

      if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { id: fromResp.id, similarity };
      }
    }

    if (bestMatch) {
      matchedFromIds.add(bestMatch.id);
      results.push({
        id: toResp.id,
        text: toResp.text,
        category: toResp.category,
        status: bestMatch.similarity > 0.95 ? 'unchanged' : 'modified',
        similarity: bestMatch.similarity,
      });
    } else {
      results.push({
        id: toResp.id,
        text: toResp.text,
        category: toResp.category,
        status: 'added',
      });
    }
  }

  for (const fromResp of fromResponsibilities) {
    if (!matchedFromIds.has(fromResp.id)) {
      results.push({
        id: fromResp.id,
        text: fromResp.text,
        category: fromResp.category,
        status: 'removed',
      });
    }
  }

  return results;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(b.split(' ').filter((w) => w.length > 2));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  return intersection.size / union.size;
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) / 10;
}
EOF

echo "✅ career-logic.ts created"

# ============================================
# 2. API Route
# ============================================
mkdir -p src/app/api/career/analyze

cat > src/app/api/career/analyze/route.ts << 'EOF'
// src/app/api/career/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { compareRoles, type RoleComparisonResult } from '@/lib/services/career-logic';

export interface CompareRolesRequest {
  fromRoleId?: string | null;
  toRoleId: string;
}

export interface CompareRolesResponse extends RoleComparisonResult {
  charts: {
    radar: {
      data: Array<{
        subject: string;
        current: number;
        target: number;
        fullMark: number;
      }>;
      config: {
        currentColor: string;
        targetColor: string;
      };
    };
    skillDelta: {
      data: Array<{
        name: string;
        competenceField: string;
        delta: number;
        from: number;
        to: number;
        status: 'upgrade' | 'new' | 'removed' | 'unchanged';
      }>;
    };
  };
}

function transformToRechartsFormat(result: RoleComparisonResult): CompareRolesResponse {
  const radarData = result.radarChartData.map((cf) => ({
    subject: cf.competenceField,
    current: cf.fromRole,
    target: cf.toRole,
    fullMark: cf.maxLevel,
  }));

  const skillDeltaData = result.skillComparisons
    .filter((s) => s.delta !== 0 || s.isNew || s.isRemoved)
    .map((s) => ({
      name: s.skillName,
      competenceField: s.competenceFieldName,
      delta: s.delta,
      from: s.fromLevel,
      to: s.toLevel,
      status: s.isNew
        ? 'new' as const
        : s.isRemoved
        ? 'removed' as const
        : s.delta > 0
        ? 'upgrade' as const
        : 'unchanged' as const,
    }))
    .sort((a, b) => {
      if (a.status === 'new' && b.status !== 'new') return -1;
      if (b.status === 'new' && a.status !== 'new') return 1;
      return b.delta - a.delta;
    });

  return {
    ...result,
    charts: {
      radar: {
        data: radarData,
        config: {
          currentColor: '#3b82f6',
          targetColor: '#8b5cf6',
        },
      },
      skillDelta: {
        data: skillDeltaData,
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRolesRequest = await request.json();

    if (!body.toRoleId) {
      return NextResponse.json(
        { error: 'toRoleId is required' },
        { status: 400 }
      );
    }

    const result = await compareRoles(body.fromRoleId || null, body.toRoleId);
    const response = transformToRechartsFormat(result);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Role comparison error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const toRoleId = searchParams.get('toRoleId') || searchParams.get('targetRoleId');
  const fromRoleId = searchParams.get('fromRoleId') || searchParams.get('currentRoleId');

  if (!toRoleId) {
    return NextResponse.json(
      { error: 'toRoleId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const result = await compareRoles(fromRoleId || null, toRoleId);
    const response = transformToRechartsFormat(result);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Role comparison error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
EOF

echo "✅ API route created"

# ============================================
# 3. CareerRadarChart.tsx
# ============================================
cat > src/app/my-career/compare/components/CareerRadarChart.tsx << 'EOF'
'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RadarChartData } from '@/lib/services/career-logic';

interface CareerRadarChartProps {
  data: RadarChartData[];
  fromRoleName: string | null;
  toRoleName: string;
  currentColor?: string;
  targetColor?: string;
}

interface ChartDataPoint {
  subject: string;
  current: number;
  target: number;
  fullMark: number;
  skillCount: number;
}

export function CareerRadarChart({
  data,
  fromRoleName,
  toRoleName,
  currentColor = '#3b82f6',
  targetColor = '#8b5cf6',
}: CareerRadarChartProps) {
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((cf) => ({
      subject: cf.competenceField,
      current: cf.fromRole,
      target: cf.toRole,
      fullMark: cf.maxLevel,
      skillCount: cf.skills.length,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload as ChartDataPoint;
    const currentValue = payload.find((p: any) => p.dataKey === 'current')?.value ?? 0;
    const targetValue = payload.find((p: any) => p.dataKey === 'target')?.value ?? 0;
    const delta = targetValue - currentValue;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl border border-slate-200 p-4 min-w-[200px]"
      >
        <div className="font-semibold text-slate-800 mb-2">
          {dataPoint.subject}
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentColor }}
              />
              {fromRoleName || 'Current'}
            </span>
            <span className="font-mono font-medium">
              {currentValue.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: targetColor }}
              />
              {toRoleName}
            </span>
            <span className="font-mono font-medium">
              {targetValue.toFixed(1)}
            </span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">Delta</span>
            <span
              className={`font-mono font-bold ${
                delta > 0
                  ? 'text-amber-600'
                  : delta < 0
                  ? 'text-green-600'
                  : 'text-slate-500'
              }`}
            >
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {dataPoint.skillCount} skill{dataPoint.skillCount !== 1 ? 's' : ''} in this field
          </div>
        </div>
      </motion.div>
    );
  };

  const CustomLegend = () => (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded"
          style={{ backgroundColor: currentColor, opacity: 0.7 }}
        />
        <span className="text-sm text-slate-600">
          {fromRoleName || 'Current Level'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="w-4 h-4 rounded border-2 border-dashed"
          style={{ borderColor: targetColor }}
        />
        <span className="text-sm text-slate-600">{toRoleName}</span>
      </div>
    </div>
  );

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 rounded-xl">
        <p className="text-slate-500">No competence data available</p>
      </div>
    );
  }

  if (chartData.length < 3) {
    return (
      <div className="flex items-center justify-center h-80 bg-slate-50 rounded-xl">
        <div className="text-center">
          <p className="text-slate-500 mb-2">
            Not enough competence fields for radar visualization
          </p>
          <p className="text-sm text-slate-400">
            Minimum 3 competence fields required
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={({ payload, x, y, cx, cy, ...rest }) => {
                const radius = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                const angle = Math.atan2(y - cy, x - cx);
                const labelRadius = radius + 15;
                const labelX = cx + labelRadius * Math.cos(angle);
                const labelY = cy + labelRadius * Math.sin(angle);

                return (
                  <text
                    {...rest}
                    x={labelX}
                    y={labelY}
                    textAnchor={labelX > cx ? 'start' : labelX < cx ? 'end' : 'middle'}
                    dominantBaseline="middle"
                    className="fill-slate-600 text-xs font-medium"
                    style={{ fontSize: '11px' }}
                  >
                    {payload.value.length > 15
                      ? `${payload.value.substring(0, 15)}...`
                      : payload.value}
                  </text>
                );
              }}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 4]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickCount={5}
              axisLine={false}
            />
            <Radar
              name={fromRoleName || 'Current'}
              dataKey="current"
              stroke={currentColor}
              fill={currentColor}
              fillOpacity={0.25}
              strokeWidth={2}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Radar
              name={toRoleName}
              dataKey="target"
              stroke={targetColor}
              fill={targetColor}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="6 4"
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <CustomLegend />
    </motion.div>
  );
}
EOF

echo "✅ CareerRadarChart.tsx created"

# ============================================
# 4. ResponsibilityDeltaView.tsx
# ============================================
cat > src/app/my-career/compare/components/ResponsibilityDeltaView.tsx << 'EOF'
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
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    badgeColor: 'bg-emerald-100 text-emerald-700',
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
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconColor: 'text-slate-400',
    badgeColor: 'bg-slate-100 text-slate-600',
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
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Briefcase className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">
          No Responsibilities Found
        </h3>
        <p className="text-slate-500 mt-1">
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
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mr-2">
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
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        category === 'Leadership'
                          ? 'bg-purple-100'
                          : category === 'Strategic'
                          ? 'bg-blue-100'
                          : category === 'Technical'
                          ? 'bg-green-100'
                          : 'bg-slate-200'
                      )}
                    >
                      <CategoryIcon
                        className={cn(
                          'w-4 h-4',
                          category === 'Leadership'
                            ? 'text-purple-600'
                            : category === 'Strategic'
                            ? 'text-blue-600'
                            : category === 'Technical'
                            ? 'text-green-600'
                            : 'text-slate-600'
                        )}
                      />
                    </div>
                    <span className="font-semibold text-slate-700">{category}</span>
                    <span className="text-sm text-slate-400">
                      ({items.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-slate-400 transition-transform',
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
          className="text-center py-8 text-slate-500"
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
        'flex items-start gap-3 p-3 rounded-lg border transition-all',
        'hover:shadow-sm',
        config.bgColor,
        config.borderColor
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          responsibility.status === 'added'
            ? 'bg-emerald-100'
            : responsibility.status === 'removed'
            ? 'bg-red-100'
            : responsibility.status === 'modified'
            ? 'bg-amber-100'
            : 'bg-slate-100'
        )}
      >
        <Icon className={cn('w-4 h-4', config.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-relaxed',
            responsibility.status === 'removed'
              ? 'text-slate-500 line-through'
              : 'text-slate-700'
          )}
        >
          {responsibility.text}
        </p>

        {responsibility.status === 'modified' && responsibility.similarity && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden max-w-[100px]">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${responsibility.similarity * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">
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
      ? 'bg-slate-800 text-white'
      : 'bg-white text-slate-600 hover:bg-slate-50',
    success: active
      ? 'bg-emerald-600 text-white'
      : 'bg-white text-emerald-600 hover:bg-emerald-50',
    warning: active
      ? 'bg-amber-500 text-white'
      : 'bg-white text-amber-600 hover:bg-amber-50',
    danger: active
      ? 'bg-red-500 text-white'
      : 'bg-white text-red-600 hover:bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
        variantStyles[variant],
        active ? 'border-transparent' : 'border-slate-200'
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            'px-1.5 py-0.5 rounded-full text-xs',
            active
              ? 'bg-white/20'
              : variant === 'success'
              ? 'bg-emerald-100'
              : variant === 'warning'
              ? 'bg-amber-100'
              : variant === 'danger'
              ? 'bg-red-100'
              : 'bg-slate-100'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
EOF

echo "✅ ResponsibilityDeltaView.tsx created"

# ============================================
# 5. SkillDeltaView.tsx
# ============================================
cat > src/app/my-career/compare/components/SkillDeltaView.tsx << 'EOF'
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

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  1: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  2: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  3: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  4: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
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
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No Skills to Compare</h3>
        <p className="text-slate-500 mt-1">Select roles to see skill differences</p>
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
            color="amber"
          >
            Upgrades
          </FilterPill>
          <FilterPill
            active={filter === 'new'}
            onClick={() => setFilter('new')}
            count={counts.new}
            color="emerald"
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

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'list'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-md transition-all',
              viewMode === 'grid'
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
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
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        fieldSkills[0]?.competenceFieldColor || '#6366f1',
                    }}
                  />
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
          className="text-center py-8 text-slate-500"
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
        'group flex items-center gap-4 p-4 rounded-xl border transition-all',
        'hover:shadow-md',
        skill.isNew
          ? 'bg-emerald-50/50 border-emerald-200'
          : skill.isRemoved
          ? 'bg-red-50/50 border-red-200'
          : skill.delta > 0
          ? 'bg-white border-slate-200'
          : 'bg-slate-50 border-slate-200'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'font-medium truncate',
              skill.isRemoved ? 'text-slate-500 line-through' : 'text-slate-800'
            )}
          >
            {skill.skillName}
          </span>
          {skill.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
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
            'px-3 py-1.5 rounded-lg text-sm font-medium border',
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
              ? 'text-amber-500'
              : skill.delta < 0
              ? 'text-red-400'
              : 'text-slate-300'
          )}
        />

        <div
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium border',
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
            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold',
            skill.delta > 0
              ? 'bg-amber-100 text-amber-700'
              : skill.delta < 0
              ? 'bg-red-100 text-red-600'
              : 'bg-slate-100 text-slate-500'
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
        'relative p-4 rounded-xl border transition-all hover:shadow-md',
        skill.isNew
          ? 'bg-emerald-50 border-emerald-200'
          : skill.isRemoved
          ? 'bg-red-50 border-red-200'
          : 'bg-white border-slate-200'
      )}
    >
      {skill.delta !== 0 && (
        <div
          className={cn(
            'absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm',
            skill.delta > 0
              ? 'bg-amber-400 text-white'
              : 'bg-red-400 text-white'
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
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          )}
        >
          {skill.isNew ? 'NEW' : 'DEL'}
        </div>
      )}

      <h4
        className={cn(
          'font-medium text-sm mb-3 line-clamp-2',
          skill.isRemoved ? 'text-slate-500' : 'text-slate-800'
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
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
                : 'bg-slate-200'
            )}
          />
        ))}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        {LEVEL_NAMES[skill.fromLevel]} → {LEVEL_NAMES[skill.toLevel]}
      </div>
    </motion.div>
  );
}

function FilterPill({
  children,
  active,
  onClick,
  count,
  color = 'slate',
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count?: number;
  color?: 'slate' | 'amber' | 'emerald' | 'red';
}) {
  const colorStyles = {
    slate: active ? 'bg-slate-800 text-white' : 'bg-white hover:bg-slate-50',
    amber: active ? 'bg-amber-500 text-white' : 'bg-white hover:bg-amber-50 text-amber-700',
    emerald: active ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-emerald-50 text-emerald-700',
    red: active ? 'bg-red-500 text-white' : 'bg-white hover:bg-red-50 text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 transition-all',
        colorStyles[color]
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'px-1.5 rounded-full text-xs',
            active ? 'bg-white/20' : 'bg-slate-100'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
EOF

echo "✅ SkillDeltaView.tsx created"

# ============================================
# 6. CompareView.tsx (continued in next file due to size)
# ============================================
cat > src/app/my-career/compare/components/CompareView.tsx << 'COMPAREEOF'
'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Loader2,
  RefreshCw,
  GitCompare,
  TrendingUp,
  Sparkles,
  Users,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { GroupedRoles } from '@/app/actions/get-roles';
import type { RoleComparisonResult } from '@/lib/services/career-logic';
import { RoleSelector } from '../../components/RoleSelector';
import { CareerRadarChart } from './CareerRadarChart';
import { SkillDeltaView } from './SkillDeltaView';
import { ResponsibilityDeltaView } from './ResponsibilityDeltaView';
import { cn } from '@/lib/utils';

interface CompareViewProps {
  groupedRoles: GroupedRoles[];
}

type TabType = 'skills' | 'responsibilities';

export function CompareView({ groupedRoles }: CompareViewProps) {
  const [fromRoleId, setFromRoleId] = useState<string | null>(null);
  const [toRoleId, setToRoleId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<RoleComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabType>('skills');

  const animationKey = `${fromRoleId}-${toRoleId}`;

  const fetchComparison = useCallback(async () => {
    if (!toRoleId) return;

    setError(null);
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ toRoleId });
        if (fromRoleId) {
          params.append('fromRoleId', fromRoleId);
        }

        const response = await fetch(`/api/career/analyze?${params}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to compare roles');
        }

        const data = await response.json();
        setComparison(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed');
        setComparison(null);
      }
    });
  }, [fromRoleId, toRoleId]);

  useEffect(() => {
    if (toRoleId) {
      fetchComparison();
    }
  }, [toRoleId, fromRoleId, fetchComparison]);

  const handleReset = () => {
    setFromRoleId(null);
    setToRoleId(null);
    setComparison(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <GitCompare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Role Comparison</h1>
                <p className="text-sm text-slate-500">Compare skills and responsibilities between roles</p>
              </div>
            </div>
            {comparison && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
              <RoleSelector
                label="From Role (optional)"
                placeholder="Select starting role..."
                groupedRoles={groupedRoles}
                selectedRoleId={fromRoleId}
                onSelect={setFromRoleId}
              />
              <div className="hidden md:flex items-center justify-center pb-3">
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                  <ArrowRight className="w-6 h-6 text-indigo-400" />
                </motion.div>
              </div>
              <RoleSelector
                label="To Role"
                placeholder="Select target role..."
                groupedRoles={groupedRoles}
                selectedRoleId={toRoleId}
                onSelect={setToRoleId}
              />
            </div>

            {isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-center justify-center gap-2 text-indigo-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing roles...</span>
              </motion.div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </motion.div>
            )}
          </div>
        </motion.section>

        <AnimatePresence mode="wait">
          {comparison && (
            <motion.div
              key={animationKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              <SummaryCards comparison={comparison} />

              <div className="grid lg:grid-cols-5 gap-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Competence Overview
                  </h3>
                  <CareerRadarChart
                    data={comparison.radarChartData}
                    fromRoleName={comparison.fromRole?.name || null}
                    toRoleName={comparison.toRole.name}
                  />
                </motion.div>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex border-b border-slate-200">
                    <TabButton active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={TrendingUp} label="Skills" count={comparison.skillComparisons.filter((s) => s.delta !== 0 || s.isNew).length} />
                    <TabButton active={activeTab === 'responsibilities'} onClick={() => setActiveTab('responsibilities')} icon={FileText} label="Responsibilities" count={comparison.responsibilityDiff.filter((r) => r.status !== 'unchanged').length} />
                  </div>

                  <div className="p-6 max-h-[600px] overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {activeTab === 'skills' ? (
                        <motion.div key="skills" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                          <SkillDeltaView skills={comparison.skillComparisons} animationKey={animationKey} />
                        </motion.div>
                      ) : (
                        <motion.div key="responsibilities" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                          <ResponsibilityDeltaView responsibilities={comparison.responsibilityDiff} animationKey={animationKey} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>

              {comparison.softSkillComparisons.some((s) => s.status !== 'unchanged') && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Soft Skills Changes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {comparison.softSkillComparisons.filter((s) => s.status !== 'unchanged').map((skill) => (
                      <motion.span
                        key={skill.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                          skill.status === 'added' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        )}
                      >
                        {skill.status === 'added' ? <Sparkles className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">−</span>}
                        {skill.name}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!comparison && !isPending && !error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-50 flex items-center justify-center">
              <GitCompare className="w-12 h-12 text-indigo-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to compare roles?</h3>
            <p className="text-slate-500 max-w-md mx-auto">Select a target role above to see a detailed comparison of skills, responsibilities, and competence requirements.</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function SummaryCards({ comparison }: { comparison: RoleComparisonResult }) {
  const { summary } = comparison;

  const cards = [
    { label: 'Skill Upgrades', value: summary.totalSkillUpgrades, icon: TrendingUp, color: 'from-amber-500 to-orange-500', description: `Avg +${summary.averageLevelIncrease} levels` },
    { label: 'New Skills', value: summary.totalNewSkills, icon: Sparkles, color: 'from-emerald-500 to-teal-500', description: 'To learn' },
    { label: 'New Tasks', value: summary.newResponsibilities, icon: FileText, color: 'from-blue-500 to-indigo-500', description: 'Responsibilities' },
  ];

  if (summary.leadershipChange !== 'none') {
    cards.push({
      label: 'Leadership',
      value: summary.leadershipChange === 'gained' ? '✓' : summary.leadershipChange === 'upgraded' ? '↑' : '−',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: summary.leadershipChange === 'gained' ? 'New leadership role' : summary.leadershipChange === 'upgraded' ? 'Leadership upgrade' : 'Leadership removed',
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="relative group">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', card.color)}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">{card.value}</div>
            <div className="text-sm font-medium text-slate-600">{card.label}</div>
            <div className="text-xs text-slate-400 mt-1">{card.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof TrendingUp; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all relative',
        active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count > 0 && (
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600')}>
          {count}
        </span>
      )}
      {active && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
    </button>
  );
}
COMPAREEOF

echo "✅ CompareView.tsx created"

# ============================================
# 7. Compare Page
# ============================================
cat > src/app/my-career/compare/page.tsx << 'EOF'
import { getRoles } from '@/app/actions/get-roles';
import { CompareView } from './components/CompareView';

export const metadata = {
  title: 'Role Comparison | Career Universe',
  description: 'Compare skills and responsibilities between roles',
};

export default async function ComparePage() {
  const groupedRoles = await getRoles();

  return <CompareView groupedRoles={groupedRoles} />;
}
EOF

echo "✅ Compare page created"

# ============================================
# 8. Index exports
# ============================================
cat > src/app/my-career/compare/components/index.ts << 'EOF'
export { CareerRadarChart } from './CareerRadarChart';
export { CompareView } from './CompareView';
export { ResponsibilityDeltaView } from './ResponsibilityDeltaView';
export { SkillDeltaView } from './SkillDeltaView';
EOF

cat > src/lib/services/index.ts << 'EOF'
export {
  compareRoles,
  calculateResponsibilityDiff,
  type SkillComparison,
  type ResponsibilityDiff,
  type SoftSkillComparison,
  type RadarChartData,
  type RoleComparisonResult,
} from './career-logic';
EOF

echo "✅ Index exports created"

echo ""
echo "=========================================="
echo "🎉 Setup complete!"
echo "=========================================="
echo ""
echo "Files created:"
echo "  - src/lib/services/career-logic.ts"
echo "  - src/app/api/career/analyze/route.ts"
echo "  - src/app/my-career/compare/page.tsx"
echo "  - src/app/my-career/compare/components/CareerRadarChart.tsx"
echo "  - src/app/my-career/compare/components/ResponsibilityDeltaView.tsx"
echo "  - src/app/my-career/compare/components/SkillDeltaView.tsx"
echo "  - src/app/my-career/compare/components/CompareView.tsx"
echo "  - src/app/my-career/compare/components/index.ts"
echo "  - src/lib/services/index.ts"
echo ""
echo "Next steps:"
echo "  1. Make sure you have the RoleSelector component in src/app/my-career/components/"
echo "  2. Make sure you have src/lib/utils.ts with the cn() function"
echo "  3. Make sure you have src/lib/prisma.ts"
echo "  4. Run: npm run dev"
echo "  5. Visit: http://localhost:3000/my-career/compare"

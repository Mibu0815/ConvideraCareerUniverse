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

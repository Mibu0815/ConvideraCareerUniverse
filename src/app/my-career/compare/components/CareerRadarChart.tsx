'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

// Internal normalized format
interface RadarData {
  subject: string;
  current: number;
  target: number;
  fullMark: number;
}

// Supports both formats: direct RadarData or RadarChartData from career-logic
interface RadarDataInput {
  subject?: string;
  competenceField?: string;
  current?: number;
  fromRole?: number;
  target?: number;
  toRole?: number;
  fullMark?: number;
  maxLevel?: number;
}

interface CareerRadarChartProps {
  data: RadarDataInput[];
  currentRoleName: string;
  targetRoleName: string;
}

export function CareerRadarChart({
  data,
  currentRoleName,
  targetRoleName,
}: CareerRadarChartProps) {
  // Transform data if needed (handle RadarChartData from career-logic)
  const chartData: RadarData[] = data.map((item: any) => ({
    subject: item.subject || item.competenceField,
    current: item.current ?? item.fromRole ?? 0,
    target: item.target ?? item.toRole ?? 0,
    fullMark: item.fullMark ?? item.maxLevel ?? 4,
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-[400px] bento-card flex items-center justify-center">
        <p className="text-brand-gray-400">No competence data available</p>
      </div>
    );
  }

  if (chartData.length < 3) {
    return (
      <div className="w-full h-[400px] bento-card flex flex-col items-center justify-center">
        <p className="text-brand-gray-500 mb-2">
          Not enough competence fields for radar visualization
        </p>
        <p className="text-sm text-brand-gray-400">
          Minimum 3 competence fields required
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] flex flex-col">
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#E5E7EB" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={(props: any) => {
                const { payload, x, y, cx, cy, ...rest } = props;
                const radius = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                const angle = Math.atan2(y - cy, x - cx);
                const labelRadius = radius + 12;
                const labelX = cx + labelRadius * Math.cos(angle);
                const labelY = cy + labelRadius * Math.sin(angle);

                const displayText =
                  payload.value.length > 14
                    ? `${payload.value.substring(0, 14)}…`
                    : payload.value;

                return (
                  <text
                    {...rest}
                    x={labelX}
                    y={labelY}
                    textAnchor={labelX > cx ? 'start' : labelX < cx ? 'end' : 'middle'}
                    dominantBaseline="middle"
                    className="fill-brand-gray-600 text-[11px] font-medium"
                  >
                    {displayText}
                  </text>
                );
              }}
              tickLine={false}
            />

            {/* Aktuelle Rolle - Die Basis (grau mit Glow) */}
            <Radar
              name={currentRoleName || 'Current'}
              dataKey="current"
              stroke="#9CA3AF"
              fill="#9CA3AF"
              fillOpacity={0.35}
              strokeWidth={2}
              className="radar-glow-current"
            />

            {/* Ziel Rolle - Die Herausforderung (schwarzer Umriss) */}
            <Radar
              name={targetRoleName}
              dataKey="target"
              stroke="#000000"
              fill="none"
              strokeWidth={3}
              className="radar-glow-target"
            />

            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                padding: '12px 16px',
              }}
            />

            <Legend
              verticalAlign="bottom"
              height={36}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CareerRadarChart;

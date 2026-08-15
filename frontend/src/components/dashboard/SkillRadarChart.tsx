'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ISkillDnaReport } from '@skilldna/shared';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { Activity, Sparkles, Code2, Cpu, Layers, Compass, TrendingUp } from 'lucide-react';

interface SkillRadarChartProps {
  report: ISkillDnaReport | null;
  isLoading?: boolean;
}

export function SkillRadarChart({ report, isLoading }: SkillRadarChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div
        id="dashboard-radar-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading Radar Chart"
      >
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-64 bg-slate-900/60 rounded-xl flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-slate-800/80"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        id="dashboard-radar-empty"
        className="glass-panel p-6 sm:p-8 border border-slate-800 space-y-4 text-center flex flex-col items-center justify-center min-h-[300px]"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
          <Activity className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-sm font-bold text-slate-200">5-Dimension Engineering Radar</h3>
          <p className="text-xs text-slate-400">
            A real-time radar chart mapping Code Quality, Problem Solving, System Design, Breadth,
            and Consistency will populate once your SkillDNA report is generated.
          </p>
        </div>
        <Link
          href="/ai-workspace"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch AI Workspace</span>
        </Link>
      </div>
    );
  }

  // Exactly 5 dimensions provided by backend
  const radarData = [
    {
      dimension: 'Code Quality',
      score: report.codeQualityScore,
      fullMark: 100,
    },
    {
      dimension: 'Problem Solving',
      score: report.problemSolvingScore,
      fullMark: 100,
    },
    {
      dimension: 'System Design',
      score: report.systemDesignScore,
      fullMark: 100,
    },
    {
      dimension: 'Tech Breadth',
      score: report.breadthScore,
      fullMark: 100,
    },
    {
      dimension: 'Consistency',
      score: report.consistencyScore,
      fullMark: 100,
    },
  ];

  const dimensionBadges = [
    {
      label: 'Code Quality',
      score: report.codeQualityScore,
      icon: Code2,
      color: 'text-emerald-400',
    },
    {
      label: 'Problem Solving',
      score: report.problemSolvingScore,
      icon: Cpu,
      color: 'text-sky-400',
    },
    {
      label: 'System Design',
      score: report.systemDesignScore,
      icon: Layers,
      color: 'text-indigo-400',
    },
    { label: 'Tech Breadth', score: report.breadthScore, icon: Compass, color: 'text-teal-400' },
    {
      label: 'Consistency',
      score: report.consistencyScore,
      icon: TrendingUp,
      color: 'text-amber-400',
    },
  ];

  return (
    <section
      id="dashboard-radar-widget"
      aria-labelledby="dashboard-radar-heading"
      className="glass-panel p-6 space-y-4 border border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-radar-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            SkillDNA Dimension Radar
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">5 Core Dimensions</span>
      </div>

      {/* Radar Chart Container */}
      <div className="h-64 sm:h-72 w-full" id="radar-chart-container">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#334155" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 9 }}
              />
              <Radar
                name="SkillDNA Score"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.35}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value: any) => [`${value} / 100`, 'Score']}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Initializing chart...
          </div>
        )}
      </div>

      {/* Dimension Chips Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-800/80">
        {dimensionBadges.map((dim, idx) => {
          const Icon = dim.icon;
          return (
            <div
              key={idx}
              className="p-2 bg-slate-900/70 border border-slate-800/80 rounded-lg text-center space-y-0.5"
            >
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium">
                <Icon className={`w-3 h-3 ${dim.color}`} aria-hidden="true" />
                <span className="truncate">{dim.label}</span>
              </div>
              <span className={`text-xs font-black ${dim.color}`}>{dim.score}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

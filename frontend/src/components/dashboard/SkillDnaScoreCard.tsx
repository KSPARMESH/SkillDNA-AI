'use client';

import Link from 'next/link';
import { ISkillDnaReport } from '@skilldna/shared';
import { Award, Sparkles, ArrowUpRight, Calendar, AlertCircle } from 'lucide-react';

export function getScoreTier(score: number): {
  label: string;
  badgeClass: string;
  description: string;
} {
  if (score >= 90) {
    return {
      label: 'EXCEPTIONAL',
      badgeClass: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/80',
      description: 'Top-tier architectural maturity & high consistency',
    };
  }
  if (score >= 75) {
    return {
      label: 'JOB READY',
      badgeClass: 'bg-teal-950/80 text-teal-400 border-teal-700/80',
      description: 'Strong technical competency across primary domains',
    };
  }
  if (score >= 60) {
    return {
      label: 'DEVELOPING',
      badgeClass: 'bg-sky-950/80 text-sky-400 border-sky-700/80',
      description: 'Solid foundation with clear improvement opportunities',
    };
  }
  return {
    label: 'FOUNDATIONAL',
    badgeClass: 'bg-amber-950/80 text-amber-400 border-amber-700/80',
    description: 'Early technical baseline; add more evidence & projects',
  };
}

function formatDate(dateValue?: Date | string | null): string {
  if (!dateValue) return 'Recently';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

interface SkillDnaScoreCardProps {
  report: ISkillDnaReport | null;
  isLoading?: boolean;
  error?: string | null;
}

export function SkillDnaScoreCard({ report, isLoading, error }: SkillDnaScoreCardProps) {
  if (isLoading) {
    return (
      <div
        id="dashboard-score-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading SkillDNA Score"
      >
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="h-10 bg-slate-800 rounded w-1/2"></div>
        <div className="h-3 bg-slate-800 rounded w-3/4"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        id="dashboard-score-error"
        className="glass-panel p-6 border border-rose-900/60 bg-rose-950/20 text-rose-300 space-y-2"
        role="alert"
      >
        <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>SkillDNA Score Unavailable</span>
        </div>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        id="dashboard-score-empty"
        className="glass-panel p-6 sm:p-7 border border-slate-800 space-y-4 text-center sm:text-left flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">SkillDNA Evaluation</span>
          </div>
          <h3 className="text-lg font-black text-slate-100">No Report Generated Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate your AI evaluation to synthesize your GitHub commits, problem solving, and
            projects into an authoritative engineering score.
          </p>
        </div>
        <div className="pt-2">
          <Link
            id="empty-score-generate-btn"
            href="/ai-workspace"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate SkillDNA Report</span>
          </Link>
        </div>
      </div>
    );
  }

  const tier = getScoreTier(report.overallScore);

  return (
    <section
      id="dashboard-score-card"
      aria-labelledby="dashboard-score-heading"
      className="glass-panel p-6 sm:p-7 border border-slate-800 space-y-5 relative overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Award className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-score-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Overall SkillDNA Score
          </h2>
        </div>
        <span
          id="dashboard-score-tier-badge"
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${tier.badgeClass}`}
        >
          {tier.label}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span
          id="dashboard-overall-score"
          className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight"
        >
          {report.overallScore}
        </span>
        <span className="text-sm font-medium text-slate-500">/ 100</span>
      </div>

      <p
        id="dashboard-score-tier-desc"
        className="text-xs text-slate-300 font-medium leading-relaxed"
      >
        {tier.description}
      </p>

      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-[11px] text-slate-500">
        <span id="dashboard-score-date" className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>Evaluated {formatDate(report.generatedAt)}</span>
        </span>
        <Link
          id="dashboard-view-full-report-link"
          href="/ai-workspace"
          className="text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1 transition-colors"
        >
          <span>Full Report</span>
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

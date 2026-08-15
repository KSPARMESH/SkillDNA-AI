'use client';

import Link from 'next/link';
import { ISkillDnaReport } from '@skilldna/shared';
import { Sparkles, CheckCircle2, Target, Zap, ArrowUpRight } from 'lucide-react';

interface KeyInsightsWidgetProps {
  report: ISkillDnaReport | null;
  isLoading?: boolean;
}

export function KeyInsightsWidget({ report, isLoading }: KeyInsightsWidgetProps) {
  if (isLoading) {
    return (
      <div
        id="dashboard-insights-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading AI Insights"
      >
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-10 bg-slate-800/60 rounded-xl"></div>
          <div className="h-10 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        id="dashboard-insights-empty"
        className="glass-panel p-6 sm:p-7 border border-slate-800 space-y-4 text-center sm:text-left flex flex-col justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400">
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">
              AI Engineering Insights
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-200">Insights Available After Evaluation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate your SkillDNA report to uncover verified technical strengths, pinpoint
            architectural blind spots, and receive Gemini-synthesized recommendations.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/ai-workspace"
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Report & View Insights</span>
          </Link>
        </div>
      </div>
    );
  }

  const topStrengths = report.strengths?.slice(0, 3) || [];
  const topWeaknesses = report.weaknesses?.slice(0, 2) || [];

  return (
    <section
      id="dashboard-insights-widget"
      aria-labelledby="dashboard-insights-heading"
      className="glass-panel p-6 space-y-5 border border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-insights-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            AI Key Insights & Strategy
          </h2>
        </div>
        <Link
          href="/ai-workspace"
          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
        >
          <span>AI Workspace</span>
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Strengths List */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>Top Verified Strengths</span>
        </div>
        <ul id="dashboard-strengths-list" className="space-y-1.5">
          {topStrengths.map((st, idx) => (
            <li
              key={idx}
              className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed line-clamp-2">{st}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Growth Areas */}
      {topWeaknesses.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Target Growth Areas</span>
          </div>
          <ul id="dashboard-weaknesses-list" className="space-y-1.5">
            {topWeaknesses.map((wk, idx) => (
              <li
                key={idx}
                className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed line-clamp-2">{wk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategic Recommendation Excerpt */}
      {report.recommendationSummary && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Strategic Recommendation
          </span>
          <p
            id="dashboard-recommendation-summary"
            className="text-xs text-slate-300 leading-relaxed line-clamp-3"
          >
            {report.recommendationSummary}
          </p>
        </div>
      )}
    </section>
  );
}

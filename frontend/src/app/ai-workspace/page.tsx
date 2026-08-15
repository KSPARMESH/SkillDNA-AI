'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { getSkillDnaReportApi, generateSkillDnaReportApi } from '@/services/api.service';
import { ISkillDnaReport } from '@skilldna/shared';
import {
  Sparkles,
  RefreshCw,
  Award,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Code2,
  Cpu,
  Compass,
  Layers,
  Calendar,
  Zap,
  Brain,
} from 'lucide-react';

function sanitizeErrorMessage(error?: string | null): string {
  if (!error) return 'An unexpected error occurred while generating your SkillDNA report.';
  // Filter out any sensitive server, database, token, or prompt strings
  if (
    error.includes('Bearer') ||
    error.includes('accessToken') ||
    error.includes('refreshToken') ||
    error.includes('password') ||
    error.includes('GEMINI_API_KEY') ||
    error.includes('PrismaClient') ||
    error.includes('at Object.') ||
    error.includes('node_modules') ||
    error.includes('prompt') ||
    error.includes('INTERNAL_SERVER_ERROR')
  ) {
    return 'Unable to complete AI evaluation due to a temporary service issue. Please try again shortly.';
  }
  return error.replace(/\s+/g, ' ').trim();
}

function getScoreTier(score: number): {
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

function formatReportDate(dateValue?: Date | string | null): string {
  if (!dateValue) return 'Recently evaluated';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Recently evaluated';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently evaluated';
  }
}

export default function AiWorkspacePage() {
  const [report, setReport] = useState<ISkillDnaReport | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch persisted report on mount
  useEffect(() => {
    const fetchLatestReport = async () => {
      setIsLoadingInitial(true);
      try {
        const response = await getSkillDnaReportApi();
        if (response && response.success && response.data) {
          setReport(response.data);
        }
      } catch (err: any) {
        // Safe fallback - if initial fetch encounters network issue, leave state clean
        console.error('[SkillDNA] Failed to retrieve persisted report:', err?.message);
      } finally {
        setIsLoadingInitial(false);
      }
    };

    fetchLatestReport();
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await generateSkillDnaReportApi();

      if (response && response.success && response.data) {
        setReport(response.data);
        setSuccessMessage(
          report
            ? 'SkillDNA Report regenerated successfully with updated evidence!'
            : 'SkillDNA Report generated successfully via Gemini AI!',
        );
      } else {
        const rawMsg = response?.message || 'Failed to generate SkillDNA report.';
        setError(sanitizeErrorMessage(rawMsg));
      }
    } catch (err: any) {
      setError(sanitizeErrorMessage(err?.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const scoreTier = report ? getScoreTier(report.overallScore) : null;
  const isBusy = isLoadingInitial || isGenerating;

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* PAGE HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                SkillDNA AI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini 3.7 Flash Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Synthesizes your verified engineering evidence across public repositories, algorithmic
              problem solving, code quality, and system architecture into a living technical
              identity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="generate-report-btn"
              onClick={handleGenerateReport}
              disabled={isBusy}
              aria-label={report ? 'Regenerate SkillDNA Report' : 'Generate SkillDNA Report'}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                report
                  ? 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 hover:shadow-emerald-950/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-emerald-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isBusy ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
                  <span>{isLoadingInitial ? 'Loading Report...' : 'Analyzing Evidence...'}</span>
                </>
              ) : (
                <>
                  {report ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                      <span>Regenerate Report</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Generate Report</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </header>

        {/* SUCCESS NOTIFICATION */}
        {successMessage && (
          <div
            id="ai-workspace-success-alert"
            role="status"
            aria-live="polite"
            className="p-4 bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-xs font-medium text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/30 animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              aria-label="Dismiss success notification"
              className="text-emerald-400 hover:text-emerald-200 text-xs ml-4 p-1 focus:outline-none focus:ring-1 focus:ring-emerald-400 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {error && (
          <div
            id="ai-workspace-error-alert"
            role="alert"
            aria-live="assertive"
            className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs font-medium text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/30 animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleGenerateReport}
                disabled={isBusy}
                className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                Retry
              </button>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss error notification"
                className="text-rose-400 hover:text-rose-200 text-xs p-1 focus:outline-none focus:ring-1 focus:ring-rose-400 rounded"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* LOADING / SKELETON STATE */}
        {isBusy && (
          <div
            id="ai-workspace-loading-state"
            className="space-y-6 animate-pulse"
            aria-busy="true"
            aria-label={
              isLoadingInitial ? 'Loading latest SkillDNA report' : 'Generating SkillDNA report'
            }
          >
            {/* Informational banner during generation/loading */}
            <div className="glass-panel p-4 border border-emerald-500/30 bg-emerald-950/30 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="text-xs text-emerald-300 font-medium">
                {isLoadingInitial
                  ? 'Retrieving your persisted SkillDNA report from server...'
                  : 'Gemini AI is analyzing your technical footprint across GitHub commits, algorithmic problem solving, code quality, and projects...'}
              </p>
            </div>

            {/* Score Skeleton */}
            <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-3 w-full md:w-1/2">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-10 bg-slate-800 rounded w-1/2"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
              </div>
              <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-slate-700"></div>
            </div>

            {/* Breakdown Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-panel p-5 space-y-3 border border-slate-800">
                  <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-2 bg-slate-800 rounded-full w-full"></div>
                </div>
              ))}
            </div>

            {/* Strengths & Weaknesses Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 space-y-3 border border-slate-800">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-12 bg-slate-800/60 rounded"></div>
                <div className="h-12 bg-slate-800/60 rounded"></div>
              </div>
              <div className="glass-panel p-6 space-y-3 border border-slate-800">
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-12 bg-slate-800/60 rounded"></div>
                <div className="h-12 bg-slate-800/60 rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* INITIAL EMPTY / NO REPORT STATE */}
        {!isBusy && !report && (
          <div
            id="ai-workspace-empty-state"
            className="glass-panel p-8 sm:p-12 text-center space-y-8 border border-slate-800/80 shadow-2xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                <Brain className="w-8 h-8" aria-hidden="true" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                No SkillDNA Report Generated Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                SkillDNA AI evaluates your engineering portfolio, connected coding platforms
                (GitHub, LeetCode, Codeforces, AtCoder), project architectures, and verification
                data to generate an authoritative evaluation with verified strengths, growth areas,
                and actionable recommendations.
              </p>
            </div>

            {/* Evaluation Dimensions Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left relative z-10">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Code2 className="w-4 h-4" aria-hidden="true" />
                  <span>Code Quality (25%)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Readability, maintainability, modular architecture, and documentation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <Cpu className="w-4 h-4" aria-hidden="true" />
                  <span>Problem Solving (25%)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Algorithmic depth, data structures, and competitive problem solving metrics.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <Layers className="w-4 h-4" aria-hidden="true" />
                  <span>System Design (20%)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Scalability, database schema design, and microservice/API patterns.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                  <Compass className="w-4 h-4" aria-hidden="true" />
                  <span>Technical Breadth (15%)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Multi-stack adaptability, tooling, cloud infra, and modern frameworks.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 sm:col-span-2 lg:col-span-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  <span>Consistency & Cadence (15%)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Continuous development cadence, verified commits, and platform sync history.
                </p>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 relative z-10">
              <button
                id="empty-state-generate-btn"
                onClick={handleGenerateReport}
                disabled={isBusy}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Generate My SkillDNA Report</span>
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE / SUCCESSFUL REPORT VIEW */}
        {!isBusy && report && (
          <div id="ai-workspace-report-container" className="space-y-8 animate-fade-in">
            {/* OVERALL SCORE HERO CARD */}
            <section
              id="overall-score-card"
              aria-labelledby="overall-score-heading"
              className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Overall SkillDNA Score
                  </span>
                  {scoreTier && (
                    <span
                      id="score-tier-badge"
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${scoreTier.badgeClass}`}
                    >
                      {scoreTier.label}
                    </span>
                  )}
                </div>
                <h2
                  id="overall-score-heading"
                  className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tight"
                >
                  <span id="overall-score-value">{report.overallScore}</span>
                  <span className="text-lg sm:text-xl font-medium text-slate-500 ml-1">/ 100</span>
                </h2>
                {scoreTier && (
                  <p id="score-tier-desc" className="text-xs text-slate-300 font-medium">
                    {scoreTier.description}
                  </p>
                )}
                <p
                  id="report-generated-timestamp"
                  className="text-[11px] text-slate-500 flex items-center justify-center md:justify-start gap-1.5 pt-1"
                >
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Generated {formatReportDate(report.generatedAt)}</span>
                </p>
              </div>

              {/* Radial / Score Visual Gauge */}
              <div className="flex flex-col items-center justify-center">
                <div
                  className="relative w-32 h-32 flex items-center justify-center"
                  role="progressbar"
                  aria-valuenow={report.overallScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Overall SkillDNA score: ${report.overallScore} out of 100`}
                >
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="stroke-slate-800"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      className="stroke-emerald-400 transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={
                        2 *
                        Math.PI *
                        50 *
                        (1 - Math.min(100, Math.max(0, report.overallScore)) / 100)
                      }
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Award className="w-6 h-6 text-emerald-400 mb-0.5" aria-hidden="true" />
                    <span className="text-sm font-black text-slate-100">
                      {Math.round(report.overallScore)}%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SCORE BREAKDOWN SECTION */}
            <section id="score-breakdown-section" aria-labelledby="score-breakdown-heading">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 id="score-breakdown-heading" className="text-lg font-bold text-slate-100">
                    Score Breakdown
                  </h2>
                  <p className="text-xs text-slate-400">
                    Core competency evaluations derived from your verified technical footprint.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Code Quality */}
                <div
                  id="score-code-quality"
                  className="glass-panel p-5 space-y-3 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-400">
                        <Code2 className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">Code Quality</h3>
                        <span className="text-[10px] text-slate-400">Weight: 25%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-emerald-400">
                      {report.codeQualityScore}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-900 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={report.codeQualityScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Code Quality Score: ${report.codeQualityScore} out of 100`}
                  >
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, report.codeQualityScore))}%` }}
                    />
                  </div>
                </div>

                {/* 2. Problem Solving */}
                <div
                  id="score-problem-solving"
                  className="glass-panel p-5 space-y-3 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-sky-950 border border-sky-800/80 text-sky-400">
                        <Cpu className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">Problem Solving</h3>
                        <span className="text-[10px] text-slate-400">Weight: 25%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-sky-400">
                      {report.problemSolvingScore}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-900 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={report.problemSolvingScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Problem Solving Score: ${report.problemSolvingScore} out of 100`}
                  >
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, report.problemSolvingScore))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3. System Design */}
                <div
                  id="score-system-design"
                  className="glass-panel p-5 space-y-3 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-800/80 text-indigo-400">
                        <Layers className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">System Design</h3>
                        <span className="text-[10px] text-slate-400">Weight: 20%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-indigo-400">
                      {report.systemDesignScore}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-900 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={report.systemDesignScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`System Design Score: ${report.systemDesignScore} out of 100`}
                  >
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, report.systemDesignScore))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4. Technical Breadth */}
                <div
                  id="score-breadth"
                  className="glass-panel p-5 space-y-3 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-teal-950 border border-teal-800/80 text-teal-400">
                        <Compass className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">Technical Breadth</h3>
                        <span className="text-[10px] text-slate-400">Weight: 15%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-teal-400">
                      {report.breadthScore}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-900 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={report.breadthScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Technical Breadth Score: ${report.breadthScore} out of 100`}
                  >
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(0, report.breadthScore))}%` }}
                    />
                  </div>
                </div>

                {/* 5. Consistency */}
                <div
                  id="score-consistency"
                  className="glass-panel p-5 space-y-3 border border-slate-800/90 hover:border-slate-700 transition-colors md:col-span-2 lg:col-span-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800/80 text-amber-400">
                        <TrendingUp className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-200">
                          Engineering Consistency
                        </h3>
                        <span className="text-[10px] text-slate-400">Weight: 15%</span>
                      </div>
                    </div>
                    <span className="text-base font-black text-amber-400">
                      {report.consistencyScore}
                      <span className="text-[10px] font-normal text-slate-400">/100</span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-900 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={report.consistencyScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Consistency Score: ${report.consistencyScore} out of 100`}
                  >
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, report.consistencyScore))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* STRENGTHS & WEAKNESSES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* STRENGTHS */}
              <section
                id="strengths-section"
                aria-labelledby="strengths-heading"
                className="glass-panel p-6 space-y-4 border border-emerald-900/40 bg-emerald-950/10"
              >
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <h2 id="strengths-heading" className="text-base font-bold text-slate-100">
                    Verified Strengths
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Validated technical capabilities identified from your evidence.
                </p>

                <ul id="strengths-list" className="space-y-2.5">
                  {report.strengths && report.strengths.length > 0 ? (
                    report.strengths.map((strength, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2.5 shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-500 italic">
                      No specific strengths identified.
                    </li>
                  )}
                </ul>
              </section>

              {/* GROWTH AREAS / WEAKNESSES */}
              <section
                id="weaknesses-section"
                aria-labelledby="weaknesses-heading"
                className="glass-panel p-6 space-y-4 border border-amber-900/40 bg-amber-950/10"
              >
                <div className="flex items-center gap-2 text-amber-400">
                  <Target className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <h2 id="weaknesses-heading" className="text-base font-bold text-slate-100">
                    Growth Areas & Weaknesses
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Targeted engineering dimensions recommended for refinement.
                </p>

                <ul id="weaknesses-list" className="space-y-2.5">
                  {report.weaknesses && report.weaknesses.length > 0 ? (
                    report.weaknesses.map((weakness, idx) => (
                      <li
                        key={idx}
                        className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-start gap-2.5 shadow-sm"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span className="leading-relaxed">{weakness}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-slate-500 italic">
                      No specific growth areas noted.
                    </li>
                  )}
                </ul>
              </section>
            </div>

            {/* RECOMMENDATION SUMMARY */}
            <section
              id="recommendation-section"
              aria-labelledby="recommendation-heading"
              className="glass-panel p-6 sm:p-8 space-y-4 border border-slate-800 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-emerald-400">
                <Zap className="w-5 h-5" aria-hidden="true" />
                <h2 id="recommendation-heading" className="text-base font-bold text-slate-100">
                  AI Strategic Recommendation
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Synthesized evaluation and next engineering milestones formulated by Gemini AI.
              </p>

              <div
                id="recommendation-summary-text"
                className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 leading-relaxed relative"
              >
                <p className="whitespace-pre-line">{report.recommendationSummary}</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

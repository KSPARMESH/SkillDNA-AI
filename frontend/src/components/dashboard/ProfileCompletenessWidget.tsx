'use client';

import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';

interface ProfileCompletenessWidgetProps {
  user: any | null;
  projectsCount?: number;
  integrationsCount?: number;
  isLoading?: boolean;
}

export function calculateProfileCompleteness(
  user: any | null,
  projectsCount: number = 0,
  integrationsCount: number = 0,
): { percentage: number; checklist: { label: string; done: boolean; weight: number }[] } {
  if (!user) return { percentage: 0, checklist: [] };

  const checklist = [
    {
      label: 'Headline & Target Role',
      done: Boolean(user.headline?.trim() || user.profile?.targetRole?.trim()),
      weight: 15,
    },
    {
      label: 'Bio & Overview',
      done: Boolean(user.bio?.trim() || user.profile?.summary?.trim()),
      weight: 10,
    },
    {
      label: 'Location & Contact Links',
      done: Boolean(
        user.location?.trim() ||
        user.websiteUrl?.trim() ||
        user.githubUsername?.trim() ||
        user.linkedinUrl?.trim(),
      ),
      weight: 10,
    },
    {
      label: 'Skills Added',
      done: Boolean(user.skills && user.skills.length > 0),
      weight: 20,
    },
    {
      label: 'Projects Added',
      done: Boolean(projectsCount > 0 || (user.projects && user.projects.length > 0)),
      weight: 20,
    },
    {
      label: 'Connected Evidence Platforms',
      done: Boolean(integrationsCount > 0),
      weight: 15,
    },
    {
      label: 'Education or Certifications',
      done: Boolean(
        (user.educations && user.educations.length > 0) ||
        (user.certifications && user.certifications.length > 0),
      ),
      weight: 10,
    },
  ];

  const percentage = checklist.reduce((sum, item) => (item.done ? sum + item.weight : sum), 0);
  return { percentage: Math.min(100, percentage), checklist };
}

export function ProfileCompletenessWidget({
  user,
  projectsCount = 0,
  integrationsCount = 0,
  isLoading,
}: ProfileCompletenessWidgetProps) {
  if (isLoading) {
    return (
      <div
        id="dashboard-profile-health-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading Profile Health"
      >
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full w-full"></div>
      </div>
    );
  }

  const { percentage, checklist } = calculateProfileCompleteness(
    user,
    projectsCount,
    integrationsCount,
  );

  return (
    <section
      id="dashboard-profile-health-widget"
      aria-labelledby="dashboard-profile-health-heading"
      className="glass-panel p-6 space-y-4 border border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-profile-health-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Profile Completeness
          </h2>
        </div>
        <span
          id="dashboard-completeness-percentage"
          className="text-xs font-black text-emerald-400 font-mono"
        >
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Profile Completeness: ${percentage}%`}
      >
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {checklist.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
            {item.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            )}
            <span className={item.done ? 'text-slate-200' : 'text-slate-500'}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-800/80 text-right">
        <Link
          id="dashboard-edit-profile-link"
          href="/profile"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
        >
          <span>Complete Profile</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

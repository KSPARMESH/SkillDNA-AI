'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  getProfileApi,
  getSkillDnaReportApi,
  getProjectsApi,
  getIntegrationsApi,
} from '@/services/api.service';
import { ISkillDnaReport } from '@skilldna/shared';
import {
  Sparkles,
  MapPin,
  Briefcase,
  Layers,
  User as UserIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { SkillDnaScoreCard } from '@/components/dashboard/SkillDnaScoreCard';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { KeyInsightsWidget } from '@/components/dashboard/KeyInsightsWidget';
import { PlatformIntegrationsWidget } from '@/components/dashboard/PlatformIntegrationsWidget';
import { RecentProjectsWidget } from '@/components/dashboard/RecentProjectsWidget';
import { ProfileCompletenessWidget } from '@/components/dashboard/ProfileCompletenessWidget';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [report, setReport] = useState<ISkillDnaReport | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setGlobalError(null);

    try {
      const [profileResult, reportResult, projectsResult, integrationsResult] =
        await Promise.allSettled([
          getProfileApi(),
          getSkillDnaReportApi(),
          getProjectsApi(),
          getIntegrationsApi(),
        ]);

      // Profile
      if (profileResult.status === 'fulfilled' && profileResult.value?.success) {
        setProfile(profileResult.value.data);
      }

      // SkillDNA Report
      if (reportResult.status === 'fulfilled' && reportResult.value?.success) {
        setReport(reportResult.value.data || null);
      }

      // Projects
      if (projectsResult.status === 'fulfilled' && projectsResult.value?.success) {
        const rawProjects = Array.isArray(projectsResult.value.data)
          ? projectsResult.value.data
          : [];
        setProjects(rawProjects);
      }

      // Integrations
      if (integrationsResult.status === 'fulfilled' && integrationsResult.value?.success) {
        const rawIntegrations = Array.isArray(integrationsResult.value.data)
          ? integrationsResult.value.data
          : [];
        setIntegrations(rawIntegrations);
      }
    } catch {
      setGlobalError('Failed to load some dashboard sections. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const candidateName = profile
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email
    : 'Engineering Candidate';

  const headlineOrRole = profile?.headline || profile?.profile?.targetRole || 'Software Engineer';

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* GLOBAL ERROR ALERT (IF APPLICABLE) */}
        {globalError && (
          <div
            id="dashboard-global-error"
            role="alert"
            className="p-4 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs font-medium text-rose-300 flex items-center justify-between shadow-lg shadow-rose-950/30"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{globalError}</span>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1 bg-rose-900/60 hover:bg-rose-900 border border-rose-700 text-rose-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* HERO HEADER */}
        <header
          id="dashboard-hero-header"
          className="glass-panel p-6 sm:p-8 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden"
        >
          {/* Candidate Profile Info */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-lg shadow-slate-950/50 overflow-hidden">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={candidateName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-7 h-7 text-emerald-400/80" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {isLoading ? (
                  <div className="h-7 bg-slate-800 rounded w-48 animate-pulse"></div>
                ) : (
                  <h1
                    id="dashboard-candidate-name"
                    className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight"
                  >
                    {candidateName}
                  </h1>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-emerald-400">
                  {profile?.role || 'Candidate'}
                </span>
              </div>

              {isLoading ? (
                <div className="h-4 bg-slate-800 rounded w-64 animate-pulse"></div>
              ) : (
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                  <span
                    id="dashboard-candidate-headline"
                    className="flex items-center gap-1.5 text-slate-300"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{headlineOrRole}</span>
                  </span>
                  {profile?.location && (
                    <span id="dashboard-candidate-location" className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{profile.location}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              id="dashboard-nav-ai-workspace-btn"
              href="/ai-workspace"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Workspace</span>
            </Link>
            <Link
              id="dashboard-nav-integrations-btn"
              href="/integrations"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Integrations</span>
            </Link>
            <Link
              id="dashboard-nav-profile-btn"
              href="/profile"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </Link>
          </div>
        </header>

        {/* PRIMARY METRICS & EVALUATION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Left: Overall Score Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <SkillDnaScoreCard report={report} isLoading={isLoading} />
          </div>

          {/* Top Right: SkillDNA Dimension Radar (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            <SkillRadarChart report={report} isLoading={isLoading} />
          </div>
        </div>

        {/* SECONDARY ROW: AI INSIGHTS & PLATFORM INTEGRATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Key AI Insights (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <KeyInsightsWidget report={report} isLoading={isLoading} />
          </div>

          {/* Connected Platforms (6 cols) */}
          <div className="lg:col-span-6 flex flex-col">
            <PlatformIntegrationsWidget integrations={integrations} isLoading={isLoading} />
          </div>
        </div>

        {/* TERTIARY ROW: RECENT PROJECTS & PROFILE HEALTH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Projects (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <RecentProjectsWidget projects={projects} isLoading={isLoading} />
          </div>

          {/* Profile Completeness Gauge (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <ProfileCompletenessWidget
              user={profile}
              projectsCount={projects.length}
              integrationsCount={integrations.length}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

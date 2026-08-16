'use client';

import Link from 'next/link';
import { PlatformType } from '@skilldna/shared';
import {
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  PlusCircle,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  platform: PlatformType | string;
  username: string;
  isConnected: boolean;
  syncStatus?: string;
  lastSyncedAt?: Date | string | null;
}

interface PlatformIntegrationsWidgetProps {
  integrations: IntegrationItem[];
  isLoading?: boolean;
}

function formatRelativeTime(dateValue?: Date | string | null): string {
  if (!dateValue) return 'Never synced';
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'Never synced';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Never synced';
  }
}

export function PlatformIntegrationsWidget({
  integrations,
  isLoading,
}: PlatformIntegrationsWidgetProps) {
  if (isLoading) {
    return (
      <div
        id="dashboard-integrations-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading Platform Integrations"
      >
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="space-y-2">
          <div className="h-12 bg-slate-800/60 rounded-xl"></div>
          <div className="h-12 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const connectedList = integrations.filter((i) => i.isConnected);

  return (
    <section
      id="dashboard-integrations-widget"
      aria-labelledby="dashboard-integrations-heading"
      className="glass-panel p-6 space-y-4 border border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Layers className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-integrations-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Connected Evidence Sources
          </h2>
        </div>
        <span
          id="dashboard-connected-count-badge"
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-emerald-400"
        >
          {connectedList.length} Connected
        </span>
      </div>

      {connectedList.length === 0 ? (
        <div
          id="dashboard-integrations-empty"
          className="p-6 border border-dashed border-slate-800 rounded-xl text-center space-y-3 bg-slate-900/30"
        >
          <p className="text-xs text-slate-400">
            No platforms connected yet. Connect GitHub, LeetCode, or AtCoder to supply code evidence
            for your SkillDNA report.
          </p>
          <Link
            id="empty-integrations-connect-btn"
            href="/integrations"
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Connect Platforms</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5" id="dashboard-integrations-list">
          {connectedList.map((item) => {
            const isSyncSuccess = item.syncStatus === 'SUCCESS';
            const isPartialOrNeedsAuth =
              item.syncStatus === 'PARTIAL' || item.syncStatus === 'NEEDS_AUTH';
            const isRateLimited = item.syncStatus === 'RATE_LIMITED';
            const isSyncFailed = item.syncStatus === 'FAILED' || item.syncStatus === 'ERROR';
            const isSyncing = item.syncStatus === 'SYNCING' || item.syncStatus === 'IN_PROGRESS';

            return (
              <div
                key={item.id || item.platform}
                className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-700/80 transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px]">
                      {item.platform}
                    </span>
                    <span className="text-slate-400 font-mono truncate text-[11px]">
                      @{item.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>
                      {isPartialOrNeedsAuth
                        ? 'Limited sync'
                        : isRateLimited
                          ? 'Rate limited'
                          : `Synced ${formatRelativeTime(item.lastSyncedAt)}`}
                    </span>
                  </div>
                </div>

                {/* Sync status indicator */}
                <div className="shrink-0">
                  {isSyncSuccess && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Synced</span>
                    </span>
                  )}
                  {isPartialOrNeedsAuth && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{item.syncStatus === 'NEEDS_AUTH' ? 'Needs OAuth' : 'Limited'}</span>
                    </span>
                  )}
                  {isRateLimited && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Rate Limited</span>
                    </span>
                  )}
                  {isSyncFailed && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/80">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Sync Issue</span>
                    </span>
                  )}
                  {isSyncing && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/80">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Syncing</span>
                    </span>
                  )}
                  {!isSyncSuccess &&
                    !isPartialOrNeedsAuth &&
                    !isRateLimited &&
                    !isSyncFailed &&
                    !isSyncing && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800">
                        <span>Connected</span>
                      </span>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800/80 text-right">
        <Link
          id="dashboard-manage-integrations-link"
          href="/integrations"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
        >
          <span>Manage Integrations</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

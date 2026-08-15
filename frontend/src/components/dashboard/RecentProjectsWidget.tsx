'use client';

import Link from 'next/link';
import {
  FolderGit2,
  ArrowUpRight,
  Star,
  GitFork,
  Code,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  techStack: string[];
  starsCount: number;
  forksCount: number;
  linesOfCode: number;
  repoUrl?: string | null;
  liveUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface RecentProjectsWidgetProps {
  projects: ProjectItem[];
  isLoading?: boolean;
}

export function RecentProjectsWidget({ projects, isLoading }: RecentProjectsWidgetProps) {
  if (isLoading) {
    return (
      <div
        id="dashboard-projects-skeleton"
        className="glass-panel p-6 space-y-4 border border-slate-800 animate-pulse"
        aria-busy="true"
        aria-label="Loading Projects"
      >
        <div className="flex justify-between items-center">
          <div className="h-4 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
          <div className="h-20 bg-slate-800/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Sort by updatedAt descending and show top 3
  const sortedProjects = [...projects].sort((a, b) => {
    return (
      new Date(b.updatedAt || b.createdAt).getTime() -
      new Date(a.updatedAt || a.createdAt).getTime()
    );
  });
  const recentSubset = sortedProjects.slice(0, 3);

  return (
    <section
      id="dashboard-projects-widget"
      aria-labelledby="dashboard-projects-heading"
      className="glass-panel p-6 space-y-4 border border-slate-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <FolderGit2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <h2
            id="dashboard-projects-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Portfolio & Repositories
          </h2>
        </div>
        <span
          id="dashboard-project-count-badge"
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300"
        >
          {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
        </span>
      </div>

      {projects.length === 0 ? (
        <div
          id="dashboard-projects-empty"
          className="p-6 border border-dashed border-slate-800 rounded-xl text-center space-y-3 bg-slate-900/30"
        >
          <p className="text-xs text-slate-400">
            No projects added yet. Showcase your backend architectures, full-stack applications, or
            open-source tools.
          </p>
          <Link
            id="empty-projects-add-btn"
            href="/profile"
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Projects in Profile</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3" id="dashboard-projects-list">
          {recentSubset.map((project) => (
            <div
              key={project.id}
              className="p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-xl space-y-2.5 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-xs font-bold text-slate-200 truncate">{project.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{project.description}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  {project.category.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Tech Stack Chips */}
              {project.techStack && project.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.techStack.slice(0, 4).map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-emerald-400"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] text-slate-500">
                      +{project.techStack.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Metrics & Links Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-500">
                <div className="flex items-center gap-3">
                  {project.starsCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span>{project.starsCount}</span>
                    </span>
                  )}
                  {project.forksCount > 0 && (
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3 text-sky-400" />
                      <span>{project.forksCount}</span>
                    </span>
                  )}
                  {project.linesOfCode > 0 && (
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3 text-emerald-400" />
                      <span>{(project.linesOfCode / 1000).toFixed(1)}k LOC</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 text-[10px]"
                    >
                      <span>Repo</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 text-[10px]"
                    >
                      <span>Live</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-800/80 text-right">
        <Link
          id="dashboard-view-all-projects-link"
          href="/profile"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
        >
          <span>View All Projects</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

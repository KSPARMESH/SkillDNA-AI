'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-100">Candidate Dashboard</h1>
            <p className="text-xs text-slate-400">Welcome back, Parmesh KS (Student Profile)</p>
          </div>
          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full text-xs font-semibold">
            JOB READY (92% Match)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 space-y-4 md:col-span-2">
            <h2 className="text-lg font-bold text-slate-200">SkillDNA Score Breakdown</h2>
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-slate-500 text-sm">
              [ Recharts Radar Chart Widget: Code Quality (91), Problem Solving (86), System Design
              (89), Breadth (85), Consistency (92) ]
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-200">Career Readiness</h2>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">Target Role: Full Stack Engineer</p>
              <div className="w-full bg-slate-800 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full w-[92%]"></div>
              </div>
              <p className="text-xs text-emerald-400 text-right">92.0% Qualified</p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function AiWorkspacePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1 className="text-2xl font-black text-slate-100">AI Intelligence Workspace</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-emerald-400">SkillDNA Report</h2>
            <p className="text-xs text-slate-300">
              Candidate exhibits top 5% architectural maturity for 2 years of experience.
            </p>
          </div>
          <div className="glass-panel p-6 space-y-4">
            <h2 className="text-lg font-bold text-cyan-400">AI Mentor Assistant</h2>
            <div className="p-4 bg-slate-900 rounded-lg text-xs text-slate-300">
              Ask Gemini AI advice regarding system design or career roadmap...
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

'use client';

import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="glass-panel p-6 flex flex-col sm:flex-row gap-6 items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center font-black text-2xl text-slate-950">
            PK
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h1 className="text-2xl font-black text-slate-100">Parmesh KS</h1>
            <p className="text-xs text-emerald-400 font-semibold">
              Full Stack AI Engineer & Open Source Maintainer
            </p>
            <p className="text-xs text-slate-400">Tamil Nadu, India • GitHub: @parmeshks</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

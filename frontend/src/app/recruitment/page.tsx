export default function RecruitmentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-100">Recruiter Talent Directory</h1>
      <div className="glass-panel p-4 flex gap-4">
        <input type="text" placeholder="Search by verified skills (e.g. TypeScript, Next.js)..." className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500" />
        <button className="glass-button px-4 py-2 text-xs font-semibold text-emerald-400 rounded-lg">Search Candidates</button>
      </div>
    </div>
  );
}

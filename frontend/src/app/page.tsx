import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-16 py-12 text-center">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800">
          Continuous AI Technical Identity Platform
        </div>
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl text-slate-100">
          Your Static Resume is Dead. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Meet Your SkillDNA.</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Automatically aggregate, verify, and score your technical journey across GitHub, LeetCode, HackerRank, and projects using Artificial Intelligence.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/register" className="glass-button px-6 py-3 text-sm font-bold text-emerald-400 rounded-xl">Build Your SkillDNA Profile</Link>
          <Link href="/recruitment" className="px-6 py-3 text-sm font-bold text-slate-300 border border-slate-800 rounded-xl hover:bg-slate-900">Explore Verified Candidates</Link>
        </div>
      </div>

      <div className="glass-panel p-8 max-w-4xl mx-auto space-y-6 text-left border border-slate-800">
        <h2 className="text-xl font-bold text-slate-200">Interactive SkillDNA Score Demo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">Overall Score</p>
            <p className="text-3xl font-black text-emerald-400">88.5</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">Code Quality</p>
            <p className="text-3xl font-black text-cyan-400">91.0</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">Readiness Score</p>
            <p className="text-3xl font-black text-indigo-400">92.0</p>
          </div>
          <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-400">Verified Skills</p>
            <p className="text-3xl font-black text-amber-400">8</p>
          </div>
        </div>
      </div>
    </div>
  );
}

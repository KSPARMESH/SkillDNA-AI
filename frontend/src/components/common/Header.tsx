'use client';
import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-extrabold text-emerald-400 tracking-wider">
        SkillDNA <span className="text-slate-100">AI</span>
      </Link>
      <nav className="flex gap-6 text-sm text-slate-300 font-medium">
        <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Dashboard</Link>
        <Link href="/profile" className="hover:text-emerald-400 transition-colors">Profile</Link>
        <Link href="/ai-workspace" className="hover:text-emerald-400 transition-colors">AI Workspace</Link>
        <Link href="/recruitment" className="hover:text-emerald-400 transition-colors">Recruitment</Link>
        <Link href="/wrapped" className="hover:text-emerald-400 transition-colors">Wrapped</Link>
      </nav>
      <div className="flex gap-4">
        <Link href="/login" className="px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all">Sign In</Link>
        <Link href="/register" className="glass-button px-4 py-2 text-xs font-semibold text-emerald-400 rounded-lg">Get Started</Link>
      </div>
    </header>
  );
}

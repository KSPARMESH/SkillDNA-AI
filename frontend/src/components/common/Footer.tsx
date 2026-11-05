import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
      <div className="mb-3 flex items-center justify-center gap-6 text-slate-400">
        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
          Privacy Policy
        </Link>
      </div>
      <p>© 2026 SkillDNA AI — Your Living Technical Identity. Created by Parmesh KS.</p>
    </footer>
  );
}

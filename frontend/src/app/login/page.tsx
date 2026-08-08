export default function LoginPage() {
  return (
    <div className="glass-panel max-w-md mx-auto p-8 my-12 space-y-6 border border-slate-800">
      <h1 className="text-2xl font-bold text-center text-slate-100">Sign In to SkillDNA AI</h1>
      <form className="space-y-4">
        <input type="email" placeholder="Email address" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" defaultValue="student@skilldna.ai" />
        <input type="password" placeholder="Password" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" defaultValue="password123" />
        <button type="submit" className="w-full glass-button py-2.5 text-xs font-bold text-emerald-400 rounded-lg">Sign In</button>
      </form>
    </div>
  );
}

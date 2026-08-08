export default function RegisterPage() {
  return (
    <div className="glass-panel max-w-md mx-auto p-8 my-12 space-y-6 border border-slate-800">
      <h1 className="text-2xl font-bold text-center text-slate-100">Create SkillDNA Account</h1>
      <form className="space-y-4">
        <input type="text" placeholder="First Name" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" />
        <input type="text" placeholder="Last Name" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" />
        <input type="email" placeholder="Email address" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" />
        <input type="password" placeholder="Password" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200" />
        <button type="submit" className="w-full glass-button py-2.5 text-xs font-bold text-emerald-400 rounded-lg">Register Profile</button>
      </form>
    </div>
  );
}

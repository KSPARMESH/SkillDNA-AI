'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredAccessToken, parseJwt } from '@/utils/auth.util';
import { logoutApi } from '@/services/api.service';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const syncAuth = () => {
      const token = getStoredAccessToken();
      if (token) {
        setIsAuthenticated(true);
        const payload = parseJwt(token);
        if (payload?.email) {
          setUserEmail(payload.email);
        }
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    };

    syncAuth();

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-state-change', syncAuth);
      window.addEventListener('storage', syncAuth);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-state-change', syncAuth);
        window.removeEventListener('storage', syncAuth);
      }
    };
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutApi();
    } catch {
      // Safe fallback - local state is guaranteed cleared in finally block of logoutApi
    } finally {
      setIsAuthenticated(false);
      setUserEmail(null);
      setIsLoggingOut(false);
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-extrabold text-emerald-400 tracking-wider">
        SkillDNA <span className="text-slate-100">AI</span>
      </Link>
      <nav className="flex gap-6 text-sm text-slate-300 font-medium">
        <Link href="/dashboard" className="hover:text-emerald-400 transition-colors">
          Dashboard
        </Link>
        <Link href="/profile" className="hover:text-emerald-400 transition-colors">
          Profile
        </Link>
        <Link href="/ai-workspace" className="hover:text-emerald-400 transition-colors">
          AI Workspace
        </Link>
        <Link href="/recruitment" className="hover:text-emerald-400 transition-colors">
          Recruitment
        </Link>
        <Link href="/wrapped" className="hover:text-emerald-400 transition-colors">
          Wrapped
        </Link>
      </nav>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="hidden sm:inline-block text-xs text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                {userEmail}
              </span>
            )}
            <button
              id="logout-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-4 py-2 text-xs font-semibold text-rose-400 border border-rose-900/60 bg-rose-950/40 rounded-lg hover:bg-rose-900/50 hover:text-rose-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="glass-button px-4 py-2 text-xs font-semibold text-emerald-400 rounded-lg"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

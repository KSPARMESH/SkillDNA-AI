'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAccessToken, getStoredRefreshToken } from '@/utils/auth.util';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const hasAuth = !!getStoredAccessToken() || !!getStoredRefreshToken();
    if (!hasAuth) {
      setIsAuthenticated(false);
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-slate-400 font-medium animate-pulse">
          Verifying authentication...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

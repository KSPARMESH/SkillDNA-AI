'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/services/api.service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('student@skilldna.ai');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response && response.success && response.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        router.push('/dashboard');
      } else {
        const errorMsg =
          response?.message || 'Login failed. Please check your credentials and try again.';
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel max-w-md mx-auto p-8 my-12 space-y-6 border border-slate-800">
      <h1 className="text-2xl font-bold text-center text-slate-100">Sign In to SkillDNA AI</h1>
      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 disabled:opacity-50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-200 disabled:opacity-50"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full glass-button py-2.5 text-xs font-bold text-emerald-400 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

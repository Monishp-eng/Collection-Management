import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ identifier, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_38%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] flex items-center justify-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-6xl grid lg:grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-[linear-gradient(160deg,_rgba(37,99,235,0.95),_rgba(15,23,42,0.95))]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100">
              <Lock className="w-3.5 h-3.5" />
              Finance SaaS workspace
            </div>
            <h1 className="mt-6 text-4xl xl:text-5xl font-black tracking-tight leading-tight">One account, isolated books, secure access.</h1>
            <p className="mt-4 max-w-xl text-sm xl:text-base text-blue-50/80">
              Each user owns their own dashboard, customers, payments, and collections. Built for private finance operations with account-level isolation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-blue-50/80">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">JWT auth</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">User scoped data</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Dark/light UI</div>
          </div>
        </div>

        <div className="p-6 sm:p-8 xl:p-12 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Welcome back</p>
                <h2 className="text-3xl font-bold tracking-tight">Sign in</h2>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Use your email or phone number to access your isolated finance workspace.</p>

            {location.state?.message && (
              <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
                {location.state.message}
              </div>
            )}

            {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Email or Phone</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/15">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="Email address or phone number"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">Password</label>
                  <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/15">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
              New account? <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-300 hover:underline">Create one</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

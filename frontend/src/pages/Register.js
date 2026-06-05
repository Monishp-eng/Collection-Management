import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, UserPlus2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const passwordScoreHint = 'Use 8+ chars with upper, lower, number, and special character.';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please sign in.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#111827_54%,_#0f172a_100%)] flex items-center justify-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-6xl grid lg:grid-cols-[0.9fr_1.1fr] overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-[linear-gradient(160deg,_rgba(15,118,110,0.96),_rgba(15,23,42,0.96))]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              <UserPlus2 className="w-3.5 h-3.5" />
              Create your account
            </div>
            <h1 className="mt-6 text-4xl xl:text-5xl font-black tracking-tight leading-tight">Private finance workspace for every user.</h1>
            <p className="mt-4 max-w-xl text-sm xl:text-base text-emerald-50/80">
              Register once, then keep your customers, payments, and collection dashboards isolated from everyone else.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-emerald-50/80">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Account ownership</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Scoped dashboards</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Secure passwords</div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">Token login</div>
          </div>
        </div>

        <div className="p-6 sm:p-8 xl:p-12 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserPlus2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">New account</p>
                <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
              </div>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Set up your isolated finance workspace in a few seconds.</p>

            {location.state?.message && (
              <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
                {location.state.message}
              </div>
            )}

            {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" placeholder="Your full name" required />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" placeholder="name@company.com" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" placeholder="10-digit phone" pattern="\d{10}" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-emerald-500/15">
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full bg-transparent outline-none" placeholder="Create a password" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{passwordScoreHint}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Confirm Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-emerald-500/15">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-transparent outline-none" placeholder="Confirm password" autoComplete="new-password" required />
                  <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-60">
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
              Already have an account? <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
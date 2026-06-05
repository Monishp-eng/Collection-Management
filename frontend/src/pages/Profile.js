import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New password confirmation does not match');
      return;
    }

    setSaving(true);
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <UserCircle2 className="w-3.5 h-3.5" />
            Account settings
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account details and password.</p>
        </div>
        <button onClick={handleLogout} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          Logout
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-300 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Account details</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Current authenticated profile</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm">
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <div className="text-slate-500 dark:text-slate-400">Full name</div>
              <div className="mt-1 font-semibold">{user?.fullName || '—'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <div className="text-slate-500 dark:text-slate-400">Email</div>
              <div className="mt-1 font-semibold">{user?.email || '—'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <div className="text-slate-500 dark:text-slate-400">Phone</div>
              <div className="mt-1 font-semibold">{user?.phone || '—'}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <div className="text-slate-500 dark:text-slate-400">Role</div>
              <div className="mt-1 font-semibold capitalize">{user?.role || 'user'}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Change password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Keep your workspace secure.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="grid gap-4">
            <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Current password" className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" required />
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="New password" className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" required />
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 outline-none focus:ring-4 focus:ring-emerald-500/15" required />
            <button disabled={saving} type="submit" className="rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </section>
      </div>

      <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 text-sm text-slate-500 dark:text-slate-400">
        Auth state is persisted locally and revalidated on refresh. If your session expires, you are sent back to login automatically.
      </div>
    </div>
  );
}
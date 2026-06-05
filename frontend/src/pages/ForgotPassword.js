import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, KeyRound, Mail, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../api/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOTP = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.forgotPassword({ identifier });

      toast.success(response.data.message || 'Recovery code sent to your registered email.');
      
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.resetPassword({ identifier, otp, newPassword });
      toast.success(response.data.message || 'Password reset successfully');
      navigate('/login', { state: { message: 'Password has been reset. You can now sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_38%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] flex items-center justify-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-slate-950/30">
        <div className="p-6 sm:p-8 xl:p-12 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          
          <Link to="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 transition mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to sign in
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Recovery</p>
              <h2 className="text-3xl font-bold tracking-tight">Forgot Password</h2>
            </div>
          </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {step === 1 ? 'Enter your registered email address to receive a secure recovery code.' : 'Enter the recovery code you received by email and choose a new password.'}
          </p>

          {error && <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Registered Email</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/15">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="Enter your registered email address"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-60 mt-2"
              >
                {loading ? 'Sending code...' : 'Send Recovery Code'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Recovery Code (OTP)</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/15">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-transparent outline-none font-mono tracking-widest"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">New Password</label>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus-within:ring-4 focus-within:ring-blue-500/15">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="Enter new password"
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 disabled:opacity-60 mt-2"
              >
                {loading ? 'Resetting password...' : 'Confirm Reset Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

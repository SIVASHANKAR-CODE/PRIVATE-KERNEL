import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo.js';
import { apiRequest } from '../services/api.js';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const res = await apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (res.success) {
      setMessage('Password reset instructions have been sent to your email.');
    } else {
      setError(res.error?.message || 'Failed to send reset link.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 animate-in fade-in duration-200">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" />
          <h2 className="text-base font-bold mt-4">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
            Enter your registered email address to receive reset instructions
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-[#a0d2eb]/10 border border-[#a0d2eb]/30 text-xs text-[#a0d2eb]">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#a0d2eb] hover:bg-[#8ec8e4] text-[#06090f] font-bold text-sm shadow-md shadow-[#a0d2eb]/20 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-[#a0d2eb] font-bold hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Logo } from '../components/common/Logo.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await login(emailOrUsername, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Login failed');
    }
    setIsSubmitting(false);
  };


  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 animate-in fade-in duration-200">
        <div className="flex flex-col items-center mb-8">
          <Logo size="xl" />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Sign in to access your private secure communication channel
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={emailOrUsername}
              onChange={e => setEmailOrUsername(e.target.value)}
              placeholder="Username or email address"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-[#1c2940] bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-[#e5eaf5] focus:outline-none focus:ring-2 focus:ring-[#a0d2eb]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-[#e5eaf5]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#a0d2eb] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-[#1c2940] bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-[#e5eaf5] focus:outline-none focus:ring-2 focus:ring-[#a0d2eb]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#a0d2eb] hover:bg-[#8ec8e4] text-[#06090f] font-bold text-sm shadow-md shadow-[#a0d2eb]/20 transition transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#a0d2eb] font-bold hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
};

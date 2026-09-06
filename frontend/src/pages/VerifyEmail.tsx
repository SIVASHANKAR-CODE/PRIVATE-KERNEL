import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo.js';
import { apiRequest } from '../services/api.js';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verify = async () => {
      const res = await apiRequest(`/api/auth/verify-email?token=${token}`);
      if (res.success) {
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully! You can now log in.');
      } else {
        setStatus('error');
        setMessage(res.error?.message || 'Email verification failed or token has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-100 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#111724] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl p-8 text-center animate-in fade-in duration-200">
        <Logo size="lg" className="justify-center mb-4" />

        <h2 className="text-base font-bold mb-2">Email Verification</h2>

        <p
          className={`text-xs p-3 rounded-lg my-4 ${
            status === 'success'
              ? 'bg-[#a0d2eb]/10 text-[#a0d2eb] border border-[#a0d2eb]/30'
              : status === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
              : 'text-slate-500'
          }`}
        >
          {message}
        </p>

        <Link
          to="/login"
          className="inline-block px-5 py-2.5 rounded-xl bg-[#a0d2eb] hover:bg-[#8ec8e4] text-[#06090f] font-bold text-xs shadow-md shadow-[#a0d2eb]/20 transition"
        >
          Proceed to Login
        </Link>
      </div>
    </div>
  );
};

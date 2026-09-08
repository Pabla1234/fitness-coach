'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Dumbbell, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, skip to dashboard
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await axios.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/register`, {
          email,
          password,
        });
        // After register, auto-login
        setMode('login');
      }

      const res = await axios.post(`${process.env.NEXT_PUBLIC_AUTH_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      localStorage.setItem('userEmail', user.email);

      // Check if user already completed onboarding on the fitness server
      try {
        const profileRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/${user.id}`
        );
        if (profileRes.data?.profile) {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/onboarding';
        }
      } catch {
        window.location.href = '/onboarding';
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.msg ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[520px] border dark:border-slate-800">

        {/* Left Panel */}
        <div className="bg-indigo-600 dark:bg-indigo-700 p-8 md:w-2/5 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900/30 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Dumbbell size={20} />
              </div>
              <span className="font-bold text-lg tracking-wide">Fitness AI</span>
            </div>
            <h1 className="text-3xl font-extrabold mb-3 leading-tight">
              {mode === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {mode === 'login'
                ? 'Sign in to access your personalized workout and diet plans.'
                : 'Create an account to get your AI-powered fitness coach.'}
            </p>
          </div>

          <div className="relative z-10 space-y-3 hidden md:block">
            {['Personalized workout plans', 'AI diet recommendations', 'Progress tracking'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-indigo-100">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
          {/* Tab switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-8 w-fit">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 capitalize ${
                  mode === m
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Processing...</>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

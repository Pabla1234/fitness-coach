'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Step1BasicInfo from '@/components/onboarding/Step1BasicInfo';
import Step2GoalSelection from '@/components/onboarding/Step2GoalSelection';
import Step3Preferences from '@/components/onboarding/Step3Preferences';

export default function OnboardingPage() {
  const [step, setStep] = useState(1); // Start at Step 1
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedId = localStorage.getItem('userId');

    // Not logged in — send to login
    if (!token || !storedId) {
      window.location.href = '/login';
      return;
    }

    // Check if user already completed onboarding
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/${storedId}`)
      .then(res => {
        if (res.data?.profile) {
          window.location.href = '/dashboard';
        } else {
          setUserId(storedId);
          setLoading(false);
        }
      })
      .catch(() => {
        setUserId(storedId);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Initializing Coach...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in zoom-in-95 duration-500 border dark:border-slate-800">
        
        {/* Left Side - Visual & Progress */}
        <div className="bg-indigo-600 dark:bg-indigo-700 p-6 md:p-8 md:w-1/3 flex flex-col justify-between text-white relative overflow-hidden transition-colors">
           {/* Decor */}
           <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
           <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-900/30 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-6 md:mb-8">
               <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center font-bold text-lg md:text-xl">
                 💪
               </div>
               <span className="font-bold text-base md:text-lg tracking-wide">Fitness AI</span>
             </div>
             
             <h1 className="text-2xl md:text-3xl font-extrabold mb-2 md:mb-4 leading-tight text-white">
               Let's Build Your <br className="hidden md:block"/> Perfect Plan
             </h1>
             <p className="text-indigo-100 text-xs md:text-sm leading-relaxed max-w-[90%]">
               Just 3 simple steps to generate your personalized workout and diet program.
             </p>
           </div>

           {/* Mobile Progress Horizontal */}
           <div className="md:hidden flex justify-between mt-6 relative z-10">
              {[1, 2, 3].map((s) => (
                 <div key={s} className={`flex flex-col items-center gap-1 ${step >= s ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        step >= s ? 'bg-white text-indigo-600 border-white' : 'border-white/50 text-white'
                    }`}>
                        {step > s ? '✓' : s}
                    </div>
                    <span className="text-[10px] font-medium">{s === 1 ? 'Profile' : s === 2 ? 'Goals' : 'Prefs'}</span>
                 </div>
              ))}
           </div>

           {/* Desktop Progress Vertical */}
           <div className="hidden md:block relative z-10 space-y-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`flex items-center gap-4 transition-all duration-500 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                     step >= s ? 'bg-white text-indigo-600 border-white' : 'border-white/50 text-white'
                   }`}>
                     {step > s ? '✓' : s}
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold">{s === 1 ? 'Profile' : s === 2 ? 'Goals' : 'Preferences'}</p>
                      <p className="text-xs text-indigo-200">{s === 1 ? 'Basic stats' : s === 2 ? 'Target outcome' : 'Style & Diet'}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Right Side - Forms */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-white dark:bg-slate-900 relative transition-colors">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">Setting up your coach...</p>
             </div>
           ) : (
             <div className="max-w-md mx-auto h-full flex flex-col justify-center">
                {step === 1 && <Step1BasicInfo userId={userId} onNext={() => setStep(2)} />}
                {step === 2 && <Step2GoalSelection userId={userId} onNext={() => setStep(3)} />}
                {step === 3 && <Step3Preferences userId={userId} />}
             </div>
           )}
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  userId: string;
  onNext: () => void;
}

export default function Step1BasicInfo({ userId, onNext }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    height: '',
    currentWeight: '',
    bodyFatPercentage: '',
    experienceLevel: 'Beginner'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      await Promise.all([
        // Save name to users table
        formData.name.trim() && axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/name`, {
          userId,
          name: formData.name.trim(),
        }),
        // Save profile stats
        axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/profile`, {
          userId,
          age: Number(formData.age),
          gender: formData.gender,
          height: Number(formData.height),
          currentWeight: Number(formData.currentWeight),
          bodyFatPercentage: formData.bodyFatPercentage ? Number(formData.bodyFatPercentage) : undefined,
          experienceLevel: formData.experienceLevel,
        }),
      ]);
      onNext();
    } catch (err: any) {
      const msg = err.response?.data?.msg || err.response?.data?.error || 'Failed to save profile';
      alert(`Error: ${msg}`);
    }
  };

  const inputCls = "w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400";

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <h2 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">Tell us about yourself</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">We use this to calculate your metabolism and build your plan.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Your Name</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Gurkirat"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Age + Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Age</label>
            <input
              type="number"
              className={inputCls}
              placeholder="25"
              value={formData.age}
              onChange={e => setFormData({ ...formData, age: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Gender</label>
            <select
              className={inputCls}
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Height + Weight */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Height (cm)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="175"
              value={formData.height}
              onChange={e => setFormData({ ...formData, height: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Weight (kg)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="70"
              value={formData.currentWeight}
              onChange={e => setFormData({ ...formData, currentWeight: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Experience Level</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Beginner', emoji: '🌱', desc: '< 1 year' },
              { label: 'Intermediate', emoji: '💪', desc: '1–3 years' },
              { label: 'Advanced', emoji: '🔥', desc: '3+ years' },
            ].map(({ label, emoji, desc }) => (
              <button
                key={label}
                type="button"
                onClick={() => setFormData({ ...formData, experienceLevel: label })}
                className={`p-3 rounded-xl text-sm font-medium border transition-all flex flex-col items-center gap-1 ${
                  formData.experienceLevel === label
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{emoji}</span>
                <span>{label}</span>
                <span className={`text-[10px] ${formData.experienceLevel === label ? 'text-indigo-200' : 'text-slate-400'}`}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 transition-all duration-200 active:scale-95 mt-4"
        >
          Continue to Goals →
        </button>
      </form>
    </div>
  );
}

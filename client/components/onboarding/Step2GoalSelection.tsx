import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  userId: string;
  onNext: () => void;
}

export default function Step2GoalSelection({ userId, onNext }: Props) {
  const [formData, setFormData] = useState({
    primaryGoal: 'Fat Loss',
    targetWeight: '',
    timeframe: '',
    injuries: ''
  });

  const goals = [
    { id: 'Weight Gain', desc: 'Lean or dirty bulk' },
    { id: 'Bodybuilding', desc: 'Muscle + symmetry' },
    { id: 'Cutting', desc: 'Fat loss with muscle retention' },
    { id: 'Athletic Physique', desc: 'Strength + agility' },
    { id: 'Fat Loss', desc: 'General weight reduction' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/goal`, {
        userId,
        ...formData,
        targetWeight: formData.targetWeight ? Number(formData.targetWeight) : undefined
      });
      onNext();
    } catch (err) {
      console.error(err);
      alert('Failed to save goals');
    }
  };

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500">
      <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">What's your main goal?</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">We'll design the entire program around this objective.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-2">
          {goals.map((g) => (
            <div 
              key={g.id}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-between group ${
                  formData.primaryGoal === g.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 shadow-md' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              onClick={() => setFormData({...formData, primaryGoal: g.id})}
            >
              <div>
                  <div className={`font-bold ${formData.primaryGoal === g.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>{g.id}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{g.desc}</div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.primaryGoal === g.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600'
              }`}>
                  {formData.primaryGoal === g.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Target Weight (kg)</label>
                <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="e.g. 65"
                    value={formData.targetWeight}
                    onChange={e => setFormData({...formData, targetWeight: e.target.value})}
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Timeline</label>
                <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="e.g. 3 months"
                    value={formData.timeframe}
                    onChange={e => setFormData({...formData, timeframe: e.target.value})}
                />
            </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
          Continue to Preferences →
        </button>
      </form>
    </div>
  );
}

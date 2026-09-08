import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
}

export default function Step3Preferences({ userId }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    environment: 'Gym',
    daysPerWeek: 4,
    split: 'Push/Pull/Legs',
    trainingTime: 'Evening',
    cardioPreference: 'None',
    cuisine: 'International',
    budget: 'Budget'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/preferences`, {
        userId,
        ...formData,
        daysPerWeek: Number(formData.daysPerWeek),
        dietType: 'Non-Veg', // default; user can switch per-day in the diet plan
      });
      localStorage.setItem('userId', userId);
      alert('Onboarding Complete!');
      router.push('/dashboard'); // Placeholder for next phase
    } catch (err) {
      console.error(err);
      alert('Failed to save preferences');
    }
  };

  return (
    <div className="animate-in slide-in-from-right-8 fade-in duration-500 pb-4">
      <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Final Touches</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Customize how you want to train and eat.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Environment */}
        <div className="space-y-2">
           <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Where do you train?</label>
           <div className="grid grid-cols-3 gap-2">
             {['Gym', 'Home', 'Both'].map(opt => (
               <button 
                 type="button"
                 key={opt}
                 onClick={() => setFormData({...formData, environment: opt})}
                 className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                    formData.environment === opt 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105 dark:bg-indigo-600 dark:border-indigo-600' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                 }`}
               >
                 {opt}
               </button>
             ))}
           </div>
        </div>

        {/* Days Per Week Slider */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
           <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">Frequency</label>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full text-sm">
                  {formData.daysPerWeek} Days/Week
              </span>
           </div>
           <input 
             type="range" 
             min="3" max="7" 
             className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
             value={formData.daysPerWeek}
             onChange={e => setFormData({...formData, daysPerWeek: Number(e.target.value)})}
           />
           <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-500 font-medium px-1">
             <span>Min (3)</span>
             <span>Max (7)</span>
           </div>
        </div>

        {/* Diet Preferences */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥗</span>
            <h3 className="font-bold text-slate-900 dark:text-white">Diet Preferences</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">You can switch between Veg / Non-Veg per day directly in your meal plan.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Cuisine</label>
              <select
                className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white appearance-none"
                value={formData.cuisine}
                onChange={e => setFormData({...formData, cuisine: e.target.value})}
              >
                <option value="Indian">Indian</option>
                <option value="International">International</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase">Budget</label>
              <div className="grid grid-cols-2 gap-2">
                {['Budget', 'Premium'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => setFormData({...formData, budget: opt})}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-all ${
                      formData.budget === opt
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-500'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt === 'Budget' ? '💰 Budget' : '💎 Premium'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 group mt-4">
          <span>Generate My Plan</span>
          <span className="group-hover:translate-x-1 transition-transform">🚀</span>
        </button>
      </form>
    </div>
  );
}

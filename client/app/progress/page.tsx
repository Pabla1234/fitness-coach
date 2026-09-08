'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import ProgressChart from '@/components/ProgressChart';

export default function ProgressPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    weight: '',
    chest: '',
    waist: '',
    arms: '',
    notes: ''
  });

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (id) {
        setUserId(id);
        fetchLogs(id);
    }
  }, []);

  const fetchLogs = async (id: string) => {
    try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/${id}`);
        setLogs(res.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/add`, {
            userId,
            weight: Number(formData.weight),
            chest: Number(formData.chest),
            waist: Number(formData.waist),
            arms: Number(formData.arms),
            notes: formData.notes
        });
        
        setShowModal(false);
        setFormData({ weight: '', chest: '', waist: '', arms: '', notes: '' });
        fetchLogs(userId);
    } catch (err) {
        alert('Failed to save log');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
       <header className="mb-6 flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transformation Tracker</h1>
            <p className="text-gray-600">Visualize your journey</p>
          </div>
          <div className="flex gap-4">
             <Link href="/dashboard" className="text-blue-600 hover:underline flex items-center">
                ← Dashboard
             </Link>
             <button 
               onClick={() => setShowModal(true)}
               className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
             >
               + Check In
             </button>
          </div>
       </header>

       <div className="max-w-4xl mx-auto space-y-6">
           
           {/* Chart */}
           {logs.length > 0 ? (
               <ProgressChart data={logs} />
           ) : (
               <div className="bg-white p-10 text-center rounded shadow">
                   <p className="text-gray-500">No logs yet. Click "Check In" to start tracking!</p>
               </div>
           )}

           {/* History List */}
           <div className="bg-white p-6 rounded shadow">
               <h3 className="font-bold text-gray-800 mb-4">History</h3>
               <div className="overflow-x-auto">
                   <table className="w-full text-left">
                       <thead>
                           <tr className="border-b text-gray-600">
                               <th className="p-2">Date</th>
                               <th className="p-2">Weight</th>
                               <th className="p-2">Chest</th>
                               <th className="p-2">Waist</th>
                               <th className="p-2">Notes</th>
                           </tr>
                       </thead>
                       <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                                   <td className="p-2">{new Date(log.date).toLocaleDateString()}</td>
                                   <td className="p-2 font-bold">{log.weight} kg</td>
                                   <td className="p-2">{log.chest || '-'}</td>
                                   <td className="p-2">{log.waist || '-'}</td>
                                   <td className="p-2 text-sm text-gray-500">{log.notes}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       </div>

       {/* Check-in Modal */}
       {showModal && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
               <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                   <h2 className="text-xl font-bold mb-4 text-gray-800">New Check-in 📝</h2>
                   <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium">Current Weight (kg)</label>
                           <input 
                              type="number" className="w-full p-2 border rounded" 
                              value={formData.weight}
                              onChange={e => setFormData({...formData, weight: e.target.value})}
                              required
                           />
                       </div>
                       <div className="grid grid-cols-3 gap-2">
                           <div>
                               <label className="block text-xs font-medium">Chest (cm)</label>
                               <input type="number" className="w-full p-2 border rounded" 
                                  value={formData.chest}
                                  onChange={e => setFormData({...formData, chest: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-medium">Waist (cm)</label>
                               <input type="number" className="w-full p-2 border rounded" 
                                  value={formData.waist}
                                  onChange={e => setFormData({...formData, waist: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-medium">Arms (cm)</label>
                               <input type="number" className="w-full p-2 border rounded" 
                                  value={formData.arms}
                                  onChange={e => setFormData({...formData, arms: e.target.value})}
                               />
                           </div>
                       </div>
                       <div>
                           <label className="block text-sm font-medium">Notes / Feelings</label>
                           <textarea className="w-full p-2 border rounded" 
                              value={formData.notes}
                              onChange={e => setFormData({...formData, notes: e.target.value})}
                           />
                       </div>
                       <div className="flex gap-2 mt-4">
                           <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-2 border rounded hover:bg-gray-100">Cancel</button>
                           <button type="submit" className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
}

import React, { useState } from 'react';
import axios from 'axios';

interface Props {
  onNext: (userId: string) => void;
}

export default function Step0Register({ onNext }: Props) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app, use env var for API URL
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/onboarding/register`, formData);
      localStorage.setItem('userId', res.data.user.id);
      onNext(res.data.user.id);
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text" 
          placeholder="Name" 
          className="w-full p-2 border rounded text-black"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required
        />
        <input 
          type="email" 
          placeholder="Email" 
          className="w-full p-2 border rounded text-black"
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          className="w-full p-2 border rounded text-black"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Start Journey
        </button>
      </form>
    </div>
  );
}

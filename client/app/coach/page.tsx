'use client';

import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import Link from 'next/link';

const QUICK_QUESTIONS = [
  'How can I improve my bench press?',
  'Can I swap chicken for tofu?',
  'My lower back hurts after squats',
  'Suggest a high protein snack',
  'How do I progress my planche and dead hang?',
];

export default function CoachPage() {
  const [pendingPrompt, setPendingPrompt] = useState<{ text: string; nonce: number } | undefined>();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Personal Trainer</h1>
            <p className="text-gray-600">Always here to help you crush your goals</p>
          </div>
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">
            ← Back to Dashboard
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="md:col-span-2">
             <ChatInterface pendingPrompt={pendingPrompt} />
          </div>

          {/* Sidebar / Quick Prompts */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-bold text-gray-800 mb-2">💡 Quick Questions</h3>
              <div className="flex flex-col gap-2 text-sm text-blue-600">
                {QUICK_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => setPendingPrompt({ text: q, nonce: Date.now() })}
                    className="text-left hover:underline"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded shadow text-white">
              <h3 className="font-bold mb-2">Pro Tip 🚀</h3>
              <p className="text-sm opacity-90">
                Ask the AI to adjust your plan if you're traveling or have limited equipment!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

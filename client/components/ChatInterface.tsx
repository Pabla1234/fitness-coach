'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/** Workers AI sends numbered-list markers as JSON numbers, so coerce them. */
const sseText = (chunk: any): string => {
  const raw = chunk?.response ?? chunk?.choices?.[0]?.delta?.content ?? chunk?.text;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return '';
};

const GREETING: Message = {
  role: 'assistant',
  content: 'Hello! I\'m your AI Fitness Coach. Ask me anything about your workout, diet, or form! 🤖',
};

/** `pendingPrompt` lets the page push a question in (the Quick Questions list). */
export default function ChatInterface({ pendingPrompt }: { pendingPrompt?: { text: string; nonce: number } }) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: 'Please complete onboarding first!' }]);
      setInput('');
      return;
    }

    const history = messages.slice(1).slice(-6);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Stream the reply so it appears as it's written
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: text, history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error('stream unavailable');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const evt of events) {
          const line = evt.split('\n').find(l => l.startsWith('data:'));
          if (!line) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const piece = sseText(JSON.parse(payload));
            if (piece !== '') {
              answer += piece;
              setMessages(prev => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: answer } : m)));
            }
          } catch { /* partial chunk */ }
        }
      }

      if (!answer.trim()) {
        const res2 = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/ask`, { userId, message: text, history });
        setMessages(prev => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: res2.data.answer } : m)));
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      try {
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/ask`, { userId, message: text, history });
        setMessages(prev => [...prev.filter(m => m.content !== ''), { role: 'assistant', content: res.data.answer }]);
      } catch {
        setMessages(prev => [...prev.filter(m => m.content !== ''), { role: 'assistant', content: 'Sorry, I had trouble thinking. Try again.' }]);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    send();
  };

  // Fire a question pushed in from the page's Quick Questions sidebar
  const lastNonce = useRef(0);
  useEffect(() => {
    if (pendingPrompt && pendingPrompt.nonce !== lastNonce.current) {
      lastNonce.current = pendingPrompt.nonce;
      send(pendingPrompt.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt]);

  return (
    <div className="bg-white rounded-lg shadow-md h-[60vh] min-h-[420px] flex flex-col">
      <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
        <h3 className="font-bold text-lg">💬 AI Coach Chat</h3>
        {loading && (
          <button onClick={() => abortRef.current?.abort()} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full">
            Stop
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.content || <span className="inline-block w-1.5 h-4 bg-blue-400 animate-pulse align-middle rounded-sm" />}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-500 text-xs p-2 rounded-full animate-pulse">Typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t bg-white rounded-b-lg flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask about your diet, form, or schedule..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white p-2 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

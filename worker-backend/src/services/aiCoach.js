import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextForUser } from './fitnessKnowledge.js';
import { extractText } from './contentModeration.js';

const generateSystemPrompt = (profile, goal, prefs) => {
  const expertContext = getContextForUser(profile, goal, prefs);

  return `You are an expert AI Fitness Coach named Guripro Coach.

User Profile:
- Age: ${profile.age}, Gender: ${profile.gender}
- Height: ${profile.height}cm, Weight: ${profile.currentWeight || profile.current_weight}kg
- Experience: ${profile.experienceLevel || profile.experience_level}

User Goal:
- Primary Goal: ${goal.primaryGoal || goal.primary_goal}
- Target Weight: ${goal.targetWeight || goal.target_weight}kg
- Timeframe: ${goal.timeframe}
- Injuries: ${goal.injuries}

Preferences:
- Split: ${prefs.split}, Days/Week: ${prefs.daysPerWeek || prefs.days_per_week}
- Environment: ${prefs.environment}

${expertContext}

Instructions:
- Give specific, personalised advice based on this user's profile and goal.
- Keep answers concise (under 150 words) and actionable.
- Be motivating but realistic.
- If asked about diet, refer to their goal of ${goal.primaryGoal || goal.primary_goal}.
- If asked about workouts, refer to their ${prefs.split} split.`;
};

// Fastest first — we fall through the list if a model isn't available.
// `llama-3.1-8b-instruct` and `llama-3-8b-instruct` were deprecated 2026-05-30;
// leaving them here just burned a round-trip before every fallback.
const CF_MODELS = [
  '@cf/meta/llama-3.1-8b-instruct-fast',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
];

/** Trim chat history to the last few turns so prompts stay small and fast. */
const buildMessages = (systemPrompt, history = [], userMessage) => {
  const recent = (Array.isArray(history) ? history : [])
    .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-6)
    .map(m => ({ role: m.role, content: String(m.content).slice(0, 1500) }));

  return [
    { role: 'system', content: systemPrompt },
    ...recent,
    { role: 'user', content: userMessage },
  ];
};

/**
 * @param meta  optional object we annotate with `source` so callers can tell
 *              whether a real model answered or we fell back to canned advice.
 */
export const getCoachResponse = async (userId, userMessage, contextData = null, env = {}, history = [], meta = {}) => {
  try {
    let { profile, goal, prefs } = contextData || {};

    if (!profile || !goal || !prefs) {
      meta.source = 'onboarding-required';
      return "I need you to complete your profile onboarding before I can give specific advice.";
    }

    const systemPrompt = generateSystemPrompt(profile, goal, prefs);
    const messages = buildMessages(systemPrompt, history, userMessage);

    // 1. Try Cloudflare Workers AI (free, built-in, no key needed)
    if (env.AI) {
      for (const model of CF_MODELS) {
        try {
          const response = await env.AI.run(model, { messages, max_tokens: 320 });
          const text = extractText(response).trim();
          if (text) {
            meta.source = model;
            return text;
          }
        } catch (err) {
          console.warn(`Cloudflare AI [${model}] failed:`, err.message?.slice(0, 120));
          meta.lastError = err.message?.slice(0, 160);
        }
      }
    }

    // 2. Fallback: Google Gemini
    const geminiKeys = [env.GEMINI_API_KEY, env.BACKUP_API_KEY].filter(Boolean);
    for (const apiKey of geminiKeys) {
      for (const modelName of ['gemini-1.5-flash', 'gemini-pro']) {
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(`${systemPrompt}\n\nUser Question: ${userMessage}`);
          const text = result.response.text();
          if (text) {
            meta.source = `gemini:${modelName}`;
            return text;
          }
        } catch (err) {
          console.warn(`Gemini [${modelName}] failed:`, err.message?.slice(0, 100));
          meta.lastError = err.message?.slice(0, 160);
        }
      }
    }

    // 3. Last resort: canned advice. If you see this in production it means no
    //    model answered — check /api/ai/health.
    meta.source = 'static-fallback';
    return mockAIResponse(userMessage, goal.primaryGoal || goal.primary_goal);
  } catch (err) {
    console.error('AI Coach error:', err);
    meta.source = 'error';
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

/** Reports which AI backend is actually reachable — handy after deploying. */
export const checkAIHealth = async (env = {}) => {
  const result = { workersAI: { binding: !!env.AI, model: null, error: null }, gemini: { configured: false } };

  if (env.AI) {
    for (const model of CF_MODELS) {
      try {
        const res = await env.AI.run(model, {
          messages: [{ role: 'user', content: 'Reply with the word OK.' }],
          max_tokens: 5,
        });
        if (extractText(res)) { result.workersAI.model = model; break; }
      } catch (err) {
        result.workersAI.error = err.message?.slice(0, 200);
      }
    }
  }

  result.gemini.configured = !!(env.GEMINI_API_KEY || env.BACKUP_API_KEY);
  result.usingFallback = !result.workersAI.model && !result.gemini.configured;
  return result;
};

/**
 * Streaming variant — returns a Response carrying Server-Sent Events so the
 * coach starts typing in ~200ms instead of after the whole answer is generated.
 * Falls back to emitting a single complete message if streaming isn't possible.
 */
export const streamCoachResponse = async (userId, userMessage, contextData = null, env = {}, history = []) => {
  const sseHeaders = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  };

  const once = (text) => {
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: text })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      }),
      { headers: sseHeaders },
    );
  };

  const { profile, goal, prefs } = contextData || {};
  if (!profile || !goal || !prefs) {
    return once('I need you to complete your profile onboarding before I can give specific advice.');
  }

  const messages = buildMessages(generateSystemPrompt(profile, goal, prefs), history, userMessage);

  if (env.AI) {
    for (const model of CF_MODELS) {
      try {
        const stream = await env.AI.run(model, { messages, max_tokens: 320, stream: true });
        if (stream) return new Response(stream, { headers: { ...sseHeaders, 'X-Coach-Source': model } });
      } catch (err) {
        console.warn(`Cloudflare AI stream [${model}] failed:`, err.message?.slice(0, 120));
      }
    }
  }

  // No streaming path available — send the complete answer as one SSE chunk
  const answer = await getCoachResponse(userId, userMessage, contextData, env, history);
  return once(answer);
};

const mockAIResponse = (msg, goal) => {
  const m = msg.toLowerCase();
  if (m.includes('diet') || m.includes('eat') || m.includes('food') || m.includes('meal') || m.includes('protein') || m.includes('calorie') || m.includes('creatine') || m.includes('supplement')) {
    if (goal === 'Weight Gain' || goal === 'Bodybuilding')
      return `For **${goal}**, eat in a caloric surplus. Target 2g protein per kg bodyweight from chicken, eggs, fish, and dairy. Add creatine monohydrate (5g/day) — it's the most evidence-backed supplement for strength and muscle gain. Don't skip meals!`;
    return `For **${goal}**, maintain a moderate caloric deficit (300-500 kcal). Keep protein high (2g/kg) to preserve muscle. Creatine is still useful for maintaining strength while cutting. Prioritize whole foods and stay hydrated.`;
  }
  if (m.includes('workout') || m.includes('exercise') || m.includes('sets') || m.includes('reps') || m.includes('squat') || m.includes('bench') || m.includes('gym'))
    return `Consistency beats intensity! Stick to your ${goal} plan and apply **Progressive Overload** every session — add weight, reps, or improve form. Rest 60-90s for hypertrophy, 2-3 min for strength. Track every session. 💪`;
  if (m.includes('injury') || m.includes('pain') || m.includes('hurt') || m.includes('ache'))
    return `⚠️ **Safety First**: Stop any exercise causing sharp pain immediately. Lower the weight, fix your form, or switch to a pain-free alternative. If it persists for more than 3 days, rest and consult a physio.`;
  if (m.includes('sleep') || m.includes('recover') || m.includes('rest'))
    return `Recovery is where the growth happens! Aim for 7-9 hours sleep. Sleep deprivation raises cortisol which directly opposes your ${goal} progress. Keep rest days active with light walks or stretching.`;
  if (m.includes('motivat') || m.includes('give up') || m.includes('tired') || m.includes('hard'))
    return `Remember: the bad workouts build discipline more than the easy ones. Progress is non-linear — trust the process. Show up consistently for 90 days and you will not recognise yourself. I believe in you! 🚀`;
  return `Based on your **${goal}** goal — stay consistent with your plan, track weekly progress, and focus on one improvement per session. Small wins compound into massive results. Ask me anything specific! 💪`;
};

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getContextForUser } from './fitnessKnowledge.js';

const generateSystemPrompt = (profile, goal, prefs) => {
  const expertContext = getContextForUser(profile, goal, prefs);

  return `
    You are an expert AI Fitness Coach named Guripro Coach.

    User Profile:
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Height: ${profile.height}cm
    - Weight: ${profile.currentWeight || profile.current_weight}kg
    - Experience: ${profile.experienceLevel || profile.experience_level}

    User Goal:
    - Primary Goal: ${goal.primaryGoal || goal.primary_goal}
    - Target Weight: ${goal.targetWeight || goal.target_weight}kg
    - Timeframe: ${goal.timeframe}
    - Injuries: ${goal.injuries}

    Preferences:
    - Split: ${prefs.split}
    - Days/Week: ${prefs.daysPerWeek || prefs.days_per_week}
    - Environment: ${prefs.environment}

    ${expertContext}

    Instructions:
    - Answer questions specifically based on this user's profile and goal.
    - Use the EXPERT KNOWLEDGE BASE provided above to verify your advice.
    - Keep answers concise (under 150 words) and actionable.
    - Be motivating but realistic.
    - If asked about diet, refer to their goal of ${goal.primaryGoal || goal.primary_goal}.
    - If asked about workouts, refer to their ${prefs.split} split.
  `;
};

export const getCoachResponse = async (userId, userMessage, contextData = null, env = {}) => {
  try {
    let { profile, goal, prefs } = contextData || {};

    if (!profile || !goal || !prefs) {
      return "I need you to complete your profile onboarding before I can give specific advice.";
    }

    const systemPrompt = generateSystemPrompt(profile, goal, prefs);
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

    // Try Google Gemini
    if (env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(fullPrompt);
        return result.response.text();
      } catch (err) {
        console.warn('Gemini failed:', err.message);
      }
    }

    return mockAIResponse(userMessage, goal.primaryGoal || goal.primary_goal);
  } catch (err) {
    console.error('AI Coach error:', err);
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

const mockAIResponse = (msg, goal) => {
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.includes('diet') || lowerMsg.includes('eat') || lowerMsg.includes('food') || lowerMsg.includes('meal') || lowerMsg.includes('protein')) {
    if (goal === 'Weight Gain' || goal === 'Bodybuilding') {
      return `Since you're aiming for **${goal}**, focus on a caloric surplus with calorie-dense foods like nuts, avocados, and healthy oils. Aim for high protein (2g per kg of bodyweight) to build muscle. Don't skip meals!`;
    }
    return `For **${goal}**, prioritize a caloric deficit with high-volume, low-calorie foods. Focus on lean protein at every meal to preserve muscle while losing fat. Drink plenty of water!`;
  }

  if (lowerMsg.includes('workout') || lowerMsg.includes('gym') || lowerMsg.includes('exercise') || lowerMsg.includes('sets') || lowerMsg.includes('reps')) {
    return `Consistency beats intensity! Stick to your assigned split and focus on **Progressive Overload**: increase weight, reps, or improve form every week. Rest 1-2 mins for hypertrophy, 3 mins for strength. You got this! 💪`;
  }

  if (lowerMsg.includes('injury') || lowerMsg.includes('hurt') || lowerMsg.includes('pain') || lowerMsg.includes('ache')) {
    return `⚠️ **Safety First**: Stop any exercise causing sharp pain immediately. Check your form, lower the weight, or switch to a low-impact alternative. If pain persists, rest and consult a medical professional.`;
  }

  if (lowerMsg.includes('tired') || lowerMsg.includes('give up') || lowerMsg.includes('hard') || lowerMsg.includes('motivat')) {
    return `Remember why you started! Progress is non-linear. The bad workouts count just as much as the good ones — they build discipline. Just show up and be proud of yourself. I believe in you! 🚀`;
  }

  if (lowerMsg.includes('sleep') || lowerMsg.includes('rest') || lowerMsg.includes('recover')) {
    return `Recovery is where the growth happens! Aim for 7-9 hours of sleep. Lack of sleep increases cortisol which hinders ${goal}. Hydrate well and consider light stretching on rest days.`;
  }

  return `Great question! Based on your goal of **${goal}**, stay consistent with your current plan and track your progress weekly. If you have specific questions about an exercise or food, feel free to ask! 🚀`;
};

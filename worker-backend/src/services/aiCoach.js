const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const UserProfile = require('../models/UserProfile');
const Goal = require('../models/Goal');
const TrainingPreference = require('../models/TrainingPreference');
const { getContextForUser } = require('./fitnessKnowledge');

// 1. Initialize Clients
// Use gemini-1.5-flash as default, but fallback gracefully if key is invalid
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MISSING_KEY');

const openai = new OpenAI({
  apiKey: process.env.BACKUP_API_KEY || 'MISSING_KEY',
});

const generateSystemPrompt = (profile, goal, prefs) => {
  const expertContext = getContextForUser(profile, goal, prefs);

  return `
    You are an expert AI Fitness Coach.
    
    User Profile:
    - Age: ${profile.age}
    - Gender: ${profile.gender}
    - Height: ${profile.height}cm
    - Weight: ${profile.currentWeight}kg
    - Experience: ${profile.experienceLevel}
    
    User Goal:
    - Primary Goal: ${goal.primaryGoal}
    - Target Weight: ${goal.targetWeight}kg
    - Timeframe: ${goal.timeframe}
    - Injuries: ${goal.injuries}
    
    Preferences:
    - Split: ${prefs.split}
    - Days/Week: ${prefs.daysPerWeek}
    - Environment: ${prefs.environment}

    ${expertContext}
    
    Instructions:
    - Answer questions specifically based on this user's profile and goal.
    - Use the EXPERT KNOWLEDGE BASE provided above to verify your advice.
    - Keep answers concise (under 150 words) and actionable.
    - Be motivating but realistic.
    - If asked about diet, refer to their goal of ${goal.primaryGoal}.
    - If asked about workouts, refer to their ${prefs.split} split.
  `;
};

const getCoachResponse = async (userId, userMessage) => {
  try {
    console.log(`🧠 AI Coach Request for User: ${userId}`);

    // 0. Validate ID format to prevent crashes
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.warn(`⚠️ Invalid User ID format: ${userId}`);
        return "I can't find your profile. Please try logging in again.";
    }

    // 1. Fetch Context with Error Handling
    let profile, goal, prefs;
    try {
        profile = await UserProfile.findOne({ user: userId });
        goal = await Goal.findOne({ user: userId });
        prefs = await TrainingPreference.findOne({ user: userId });
    } catch (dbError) {
        console.error("❌ DB Error fetching user context:", dbError.message);
        return "I'm having trouble accessing your profile. Please try again later.";
    }

    if (!profile || !goal) {
      console.warn(`⚠️ User profile incomplete for ID: ${userId}`);
      return "I need you to complete your profile onboarding before I can give specific advice.";
    }

    const systemPrompt = generateSystemPrompt(profile, goal, prefs);
    const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

    // --- STRATEGY: TRY GOOGLE GEMINI FIRST ---
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MISSING_KEY') {
        try {
            console.log("🤖 Asking Gemini...");
            // Try 1.5 Flash first (fastest/newest)
            let model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            try {
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            } catch (flashError) {
                console.warn("⚠️ Gemini 1.5 Flash failed, trying gemini-pro...", flashError.message);
                // Fallback to gemini-pro
                model = genAI.getGenerativeModel({ model: "gemini-pro"});
                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                return response.text();
            }
        } catch (geminiError) {
            console.warn("⚠️ All Gemini Models Failed:", geminiError.message);
            console.log("🔄 Switching to Backup Provider...");
        }
    }

    // --- STRATEGY: TRY OPENAI/BACKUP SECOND ---
    if (process.env.BACKUP_API_KEY && process.env.BACKUP_API_KEY !== 'MISSING_KEY') {
        try {
            console.log("🤖 Asking Backup Provider...");
            const completion = await openai.chat.completions.create({
                messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
                ],
                model: "gpt-3.5-turbo",
                max_tokens: 300,
            });
            return completion.choices[0].message.content;
        } catch (openaiError) {
            console.warn("⚠️ Backup Provider Failed:", openaiError.message);
        }
    }

    // --- STRATEGY: FAILSAFE MOCK ---
    console.log("⚠️ All APIs failed. Using Mock Response.");
    return mockAIResponse(userMessage, goal.primaryGoal);

  } catch (err) {
    console.error("❌ Critical AI Service Error:", err);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
};

// Advanced Rule-Based Expert System (Fallback)
const mockAIResponse = (msg, goal) => {
  const lowerMsg = msg.toLowerCase();
  
  // 1. Diet & Nutrition
  if (lowerMsg.includes('diet') || lowerMsg.includes('eat') || lowerMsg.includes('food') || lowerMsg.includes('meal') || lowerMsg.includes('protein')) {
    if (goal === 'Weight Gain' || goal === 'Bodybuilding') {
        return `Since you're aiming for **${goal}**, you need to be in a caloric surplus (eating more than you burn). Focus on caloric-dense foods like nuts, avocados, and healthy oils, and aim for high protein intake (2g per kg of bodyweight) to build muscle, not just fat. Don't skip meals!`;
    } else {
        return `For **${goal}**, the most important factor is a caloric deficit. Focus on high-volume, low-calorie foods (like leafy greens and vegetables) to keep you full. prioritize lean protein (chicken, fish, tofu) at every meal to preserve muscle mass while losing fat. Drink plenty of water!`;
    }
  }
  
  // 2. Workout & Training
  if (lowerMsg.includes('workout') || lowerMsg.includes('gym') || lowerMsg.includes('exercise') || lowerMsg.includes('sets') || lowerMsg.includes('reps')) {
    return `Consistency beats intensity! Stick to your assigned split. Focus on **Progressive Overload**: try to either increase the weight, reps, or improve your form every single week. Make sure you're resting enough between sets (1-2 mins for hypertrophy, 3 mins for strength). You got this! 💪`;
  }
  
  // 3. Injury & Pain
  if (lowerMsg.includes('injury') || lowerMsg.includes('hurt') || lowerMsg.includes('pain') || lowerMsg.includes('ache')) {
    return `⚠️ **Safety First**: If you're experiencing sharp pain, stop the exercise immediately. Do not push through "bad" pain. Check your form, lower the weight, or switch to a low-impact alternative. If pain persists, please rest and consult a medical professional.`;
  }
  
  // 4. Motivation
  if (lowerMsg.includes('tired') || lowerMsg.includes('give up') || lowerMsg.includes('hard') || lowerMsg.includes('motivat')) {
    return `Remember why you started! Progress is non-linear; some days will be harder than others. The bad workouts count just as much as the good ones because they build discipline. Just show up, do what you can, and be proud of yourself. I believe in you! 🚀`;
  }

  // 5. Sleep & Recovery
  if (lowerMsg.includes('sleep') || lowerMsg.includes('rest') || lowerMsg.includes('recover')) {
    return `Recovery is where the growth happens! Aim for 7-9 hours of quality sleep per night. Lack of sleep increases cortisol (stress hormone) which can hinder ${goal}. Hydrate well and consider light stretching or walking on rest days.`;
  }

  // Default
  return `That's a great question! Based on your goal of **${goal}**, I recommend staying consistent with your current plan. Keep tracking your progress weekly. If you have specific questions about a particular exercise or food, feel free to ask! Let's crush it! 🚀`;
};

module.exports = { getCoachResponse };
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  console.log("Listing available Gemini models...");
  try {
    // There isn't a direct listModels helper in the simple client sometimes, 
    // but the error message suggested calling ListModels.
    // However, the node SDK doesn't expose listModels easily in the high-level API.
    // We'll try one more common name: "gemini-pro" again but forcing the version if possible?
    // Actually, let's try a very basic request to see if the KEY is valid at all.
    
    // BUT, the error 404 implies the endpoint was reached but resource not found.
    // This usually means the model ID is wrong.
    
    // Let's try "gemini-1.0-pro"
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Test");
    console.log("✅ gemini-1.0-pro worked!");
  } catch (error) {
    console.error("❌ gemini-1.0-pro failed:", error.message);
  }

  try {
     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
     const model = genAI.getGenerativeModel({ model: "gemini-pro" });
     const result = await model.generateContent("Test");
     console.log("✅ gemini-pro worked!");
  } catch (error) {
     console.error("❌ gemini-pro failed:", error.message);
  }
}

listModels();
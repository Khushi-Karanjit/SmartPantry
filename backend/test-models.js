require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(key);
  try {
    // There isn't a direct listModels in the SDK easily accessible without an authenticated user,
    // but we can try a few standard ones.
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.generateContent("Hi");
        const response = await result.response;
        console.log(`Model ${m} WORKS! Response: ${response.text().substring(0, 5)}...`);
        return; // Success!
      } catch (e) {
        console.log(`Model ${m} FAILED: ${e.message} (Status: ${e.status})`);
      }
    }
  } catch (err) {
    console.error("Critical Error:", err.message);
  }
}

listModels();

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Using API Key starting with:", key ? key.substring(0, 8) + "..." : "MISSING");
  
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key);
  try {
    const list = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await list.generateContent("Say hello");
    const response = await result.response;
    console.log("Gemini Response:", response.text());
  } catch (err) {
    console.error("Gemini Error:", err.message);
    if (err.status) console.log("Status Code:", err.status);
  }
}

testKey();

const axios = require("axios");
require("dotenv").config();

/**
 * AI DIAGNOSTIC SCRIPT: Finding the 404 Blockade
 * Run this with: node diagnose-ai.js
 */
async function diagnose() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is not set in your .env file!");
    return;
  }

  console.log("🔍 PROBING GEMINI API...");
  console.log(`Using Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

  // --- NEW: THE MODEL HUNTER ---
  console.log("\n📡 STEP 1: FETCHING AVAILABLE MODELS...");
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await axios.get(listUrl);
    const modelNames = listRes.data.models.map(m => m.name.replace('models/', ''));
    console.log(`✅ DISCOVERED MODELS: ${modelNames.join(", ")}`);
    
    if (modelNames.length === 0) {
      console.warn("⚠️ WARNING: Your key works, but NO models are enabled. Check Billing or API Library.");
    }
  } catch (listErr) {
    console.error("❌ FAILED TO LIST MODELS:", listErr.response?.data?.error?.message || listErr.message);
    if (listErr.response?.status === 403) {
      console.error("👉 Reason: Your API Key is likely RESTRICTED via Google Cloud Console.");
    }
  }

  // --- STEP 2: CONNECTIVITY TEST ---
  const tests = [
    { name: "Gemini 1.5 Flash (v1)", url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}` },
    { name: "Gemini 1.5 Flash Latest (v1beta)", url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}` },
    { name: "Gemini 1.0 Pro (v1)", url: `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}` }
  ];

  for (const test of tests) {
    console.log(`\n--- Testing ${test.name} ---`);
    try {
      const response = await axios.post(test.url, {
        contents: [{ parts: [{ text: "Respond with 'Connected!'" }] }]
      }, { timeout: 8000 });
      
      console.log(`✅ SUCCESS: ${test.name} is WORKING!`);
      const finalMsg = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No text returned";
      console.log(`AI Says: ${finalMsg}`);
      return; 
    } catch (err) {
      console.warn(`❌ FAILED: ${test.name} - Status ${err.response?.status || 'Network Error'}`);
    }
  }

  console.error("\n💀 ALL TESTS FAILED. Your Google Project settings are still blocking this key.");
}

diagnose();

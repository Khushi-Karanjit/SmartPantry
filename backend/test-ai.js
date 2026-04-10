require("dotenv").config();
const { extractFullRecipeFromTranscript } = require("./src/services/ai.service");

// Sample transcript fragments for Tofu Curry
const mockTranscript = [
  { text: "Today we are making tofu curry", offset: 0, duration: 2000 },
  { text: "Cut 200g of tofu into cubes", offset: 5000, duration: 3000 },
  { text: "Fry them until golden brown", offset: 10000, duration: 4000 },
  { text: "For the sauce we need onions and curry powder", offset: 20000, duration: 5000 },
  { text: "It serves two people and is keto friendly", offset: 30000, duration: 4000 }
];

async function test() {
  try {
    console.log("Testing Gemini AI with sample transcript...");
    const recipe = await extractFullRecipeFromTranscript(mockTranscript);
    console.log("SUCCESS! Extracted Recipe:", JSON.stringify(recipe, null, 2));
  } catch (err) {
    console.error("FAIL:", err.message);
    if (err.stack) console.error(err.stack);
  }
}

test();

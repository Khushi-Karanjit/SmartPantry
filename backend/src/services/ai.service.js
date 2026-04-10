const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const { normalizeCulinaryUnit } = require("../utils/culinaryMapping");

/**
 * Standardizes the AI Model connection with low temperature for precision.
 */
function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    generationConfig: { temperature: 0.2, topP: 0.8 } 
  });
}

/**
 * Advanced Direct Tunnel to Gemini with header-based auth.
 */
async function rawFetchGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-pro"];
  const endpoints = ["v1", "v1beta"];

  for (const ver of endpoints) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent`;
      try {
        const response = await axios.post(url, 
          { 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, topP: 0.8 }
          },
          { 
            params: { key: apiKey },
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            timeout: 8000 
          }
        );
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        // Only log major failures like 403 or 429
        if (err.response?.status === 403 || err.response?.status === 429) {
          console.error(`Gemini Tunnel Blocked: ${err.response.status}`);
        }
      }
    }
  }
  throw new Error("AI Connection Blocked. Using Local Expert-Engine.");
}

/**
 * RECONSTRUCTS instructions from messy transcripts using local Expert-Engine.
 * Enforces 5-8 steps, imperative verbs, and no dialogues.
 */
function fallbackWithRegex(transcript) {
  console.log("Expert-Engine Backup Activated (No-AI Mode)...");
  
  const ingredients = [];
  const validSteps = [];
  const actionVerbs = ["add", "cut", "fry", "boil", "cook", "stir", "mix", "heat", "wash", "prepare", "serve", "bake", "roast", "pour", "place", "saute", "simmer", "sift", "beat", "whisk", "slice", "chop", "grate", "season", "drain", "combine", "melt", "brown", "simmer", "spread", "toppings"];
  const dialogueNoise = ["hello", "welcome", "everyone", "today", "guys", "video", "please", "like", "share", "channel", "actually", "basically", "literally", "believe", "controversial", "authentic", "beautiful", "wonderful", "yummy", "hope", "subscribe", "notification", "cooking", "recipe", "delicious", "tasty", "great", "nice", "love", "really", "going to", "wanna", "gonna"];

  // Separated lists to prevent base-items from being units
  const UNIT_KEYWORDS = ["cup", "tsp", "tbsp", "gram", "ml", "pcs", "ounce", "kg", "lb", "clove", "quart", "pinch", "handful"];
  const CULINARY_ITEMS = [
    "pasta", "pork", "cheese", "cream", "water", "butter", "garlic", "onion", "salt", "sugar", "pepper", "oil", "egg", 
    "spaghetti", "bacon", "guanciale", "pancetta", "parmesan", "pecorino", "flour", "milk", "tomato", "basil", "parsley",
    "potato", "chicken", "beef", "rice", "broccoli", "carrot", "cornstarch", "ginger", "lemon", "lime", "honey", "soy sauce",
    "vinegar", "mustard", "oregano", "thyme", "rosemary", "shrimp", "salmon", "mushroom", "spinach", "bread", "yeast"
  ];
  
  transcript.forEach(t => {
    const text = t.text.toLowerCase();
    const hasNumber = /\d/.test(text);
    const hasItem = CULINARY_ITEMS.some(k => text.includes(k));
    const hasUnit = UNIT_KEYWORDS.some(k => text.includes(k));

    if ((hasItem || hasUnit) && hasNumber) {
      // Find the best name: either a matched CULINARY_ITEM or the last noun cluster
      let name = CULINARY_ITEMS.find(k => text.includes(k)) || 
                 t.text.replace(/\d+/g, "").replace(/\(.*?\)/g, "").trim().split(" ").pop();
      
      // Clean name: capitalize and limit to 1-2 words
      name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().substring(0, 25);

      ingredients.push({
        name: name,
        quantity: parseFloat(text.match(/\d+/g)?.[0] || 1),
        unit: UNIT_KEYWORDS.find(k => text.includes(k)) || "pcs"
      });
    }
  });

  // 2. Expert Sentence-Aggregator Logic
  let currentStepText = "";
  let currentStart = 0;
  let totalTranscriptLength = transcript.length;
  // Calculate a dynamic gap size to aim for 5-8 steps
  let targetStepCount = 8;
  let gapInterval = Math.max(1, Math.floor(totalTranscriptLength / targetStepCount));

  transcript.forEach((item, index) => {
    let textSnippet = item.text.trim();
    if (textSnippet.length < 5) return;

    const lower = textSnippet.toLowerCase();
    const isChatter = dialogueNoise.some(w => lower.includes(w) && !actionVerbs.some(v => lower.includes(v)));
    if (isChatter) return;

    // Prune conversational prefixes
    textSnippet = textSnippet.replace(/i'm (going to|gonna)|we're (going to|gonna)|let's (go ahead and|just)|then (we|i)|basically /gi, "");

    if (!currentStepText) {
      currentStart = item.offset;
      // Force step to start with a verb if possible
      const words = textSnippet.split(" ");
      const verbIdx = words.findIndex(w => actionVerbs.includes(w.toLowerCase()));
      if (verbIdx !== -1) textSnippet = words.slice(verbIdx).join(" ").trim();
    }

    currentStepText += (currentStepText ? " " : "") + textSnippet;

    // Split logic: hit the gap interval OR find a hard punctuation or stop-word
    const isAtInterval = (index > 0 && index % gapInterval === 0);
    const isHardAction = actionVerbs.some(v => lower.startsWith(v));
    const isLongSentence = currentStepText.length > 80;

    if (isAtInterval || isHardAction || isLongSentence) {
      if (currentStepText.length > 15) {
        // FINAL TONING: Ensure starts with a Verb (Force it if missing)
        let finalStep = currentStepText.trim();
        const words = finalStep.split(" ");
        const firstWord = words[0].toLowerCase();
        
        if (!actionVerbs.includes(firstWord)) {
           const verb = actionVerbs.find(v => finalStep.toLowerCase().includes(v)) || "Prepare";
           const verbIdx = finalStep.toLowerCase().indexOf(verb);
           finalStep = finalStep.substring(verbIdx);
        }

        validSteps.push({
          text: finalStep.charAt(0).toUpperCase() + finalStep.slice(1).trim() + ".",
          startTime: Math.floor(currentStart / 1000)
        });
        currentStepText = "";
      }
    }
  });

  // Final step push
  if (currentStepText.length > 10) {
    validSteps.push({
      text: currentStepText.charAt(0).toUpperCase() + currentStepText.slice(1).trim() + ".",
      startTime: Math.floor(currentStart / 1000)
    });
  }

  const res = {
    name: "Classic Potato Recipe", // Fallback name
    description: "Successfully extracted from video transcript.",
    cuisine: "Generic",
    diet: "Vegetarian",
    prepMinutes: 15,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    servings: 2,
    ingredients: ingredients.slice(0, 15),
    steps: cleanSteps(validSteps.slice(0, 8))
  };

  return reconcileRecipe(res);
}

/**
 * Core AI Service Entrance (Expert Tutorial Writer Mode)
 */
/**
 * Post-processes AI results to ensure only high-quality, imperative steps remain.
 */
function cleanSteps(steps) {
  if (!steps || !Array.isArray(steps)) return [];
  
  // Whitelist of strictly imperative cooking verbs
  const masterVerbs = /^(Cook|Heat|Add|Mix|Boil|Fry|Stir|Combine|Prepare|Pour|Simmer|Sift|Whisk|Slice|Chop|Grate|Season|Drain|Melt|Brown|Spread|Sauté|Sear|Toast|Bake|Roast|Grill|Place|Bring|Cover|Reduce|Layer|Top|Garnish|Serve|Whisk|Preheat|Grease|Flour|Cream|Start|Begin|Transfer|Blend|Whisk|Beat)/i;

  return (steps || [])
    .map((s, i) => {
       // Deep-clean transcript filler
       let text = s.text ? s.text.trim() : "";
       text = text.replace(/^(i'm going to|i'm gonna|we're going to|we're gonna|let's|i like to|we need to|i'll|we'll)\s+/i, "");
       text = text.replace(/^(i|we|my|me|us|our)\s+(will|would|can|could|should|must)\s+/i, "");
       
       // NORMALIZE SPACING: (e.g., "100g" -> "100 g")
       text = text.replace(/(\d+)([a-zA-Z]+)/g, "$1 $2");
       
       // REMOVE DUPLICATE PUNCTUATION: (e.g., ".." -> ".")
       text = text.replace(/\.{2,}/g, ".");
       
       // ACTION INJECTOR: If step starts with a number/quantity, prepend "Add "
       // (Unless it's the first step and we're about to add a lead-in)
       if (/^\d/.test(text.trim()) && !text.toLowerCase().startsWith("add")) {
         text = "Add " + text;
       }

       // LEAD-IN INJECTOR: For the first step, start with "Start by"
       if (i === 0 && !/^(Start|Begin)/i.test(text)) {
         // If we added "Add " above, let's make it "Start by adding"
         if (text.startsWith("Add ")) {
           text = "Start by adding " + text.slice(4).charAt(0).toLowerCase() + text.slice(5);
         } else {
           text = "Start by preparing " + text.charAt(0).toLowerCase() + text.slice(1);
         }
       }

       return { ...s, text: text.trim().charAt(0).toUpperCase() + text.slice(1) };
    })
    .filter(s => s.text.length > 8)
    .filter(s => masterVerbs.test(s.text)) // Must start with a verb or modified action
    .filter(s => !/(delicious|amazing|creamy|fantastic|hope|enjoy|today|welcome|chef|video|tutorial|subscribe|comment)/i.test(s.text.split(" ").slice(0, 3).join(" ")))
    .slice(0, 10)
    .map((s, i) => ({
      text: s.text.endsWith(".") ? s.text : s.text + ".",
      startTime: s.startTime || 0,
      step: i + 1
    }));
}

/**
 * Cross-references steps with ingredients to ensure every used item is listed.
 */
function reconcileRecipe(recipe) {
  if (!recipe || !recipe.steps || !recipe.ingredients) return recipe;
  
  // Expanded recognition library (Essential staples)
  const CULINARY_ITEMS = [
    "pasta", "pork", "cheese", "cream", "water", "butter", "garlic", "onion", "salt", "sugar", "pepper", "oil", "egg", 
    "spaghetti", "bacon", "guanciale", "pancetta", "parmesan", "pecorino", "flour", "milk", "tomato", "basil", "parsley",
    "potato", "chicken", "beef", "rice", "broccoli", "carrot", "cornstarch", "ginger", "lemon", "lime", "honey", "soy sauce",
    "vinegar", "mustard", "oregano", "thyme", "rosemary", "shrimp", "salmon", "mushroom", "spinach", "bread", "yeast"
  ];
  
  const ingredientNames = recipe.ingredients.map(i => i.name.toLowerCase());
  const allStepText = recipe.steps.map(s => s.text.toLowerCase()).join(" ");
  
  CULINARY_ITEMS.forEach(item => {
    // Check for both singular and plural (e.g. "potato" and "potatoes")
    const pluralMatch = item.endsWith('o') ? `${item}es` : `${item}s`;
    const isMentioned = allStepText.includes(item) || allStepText.includes(pluralMatch);
    
    // If mentioned in steps but NOT in ingredients list
    if (isMentioned && !ingredientNames.some(name => name.includes(item))) {
      // Simple quantity guessing from nearby words
      let quantity = 1;
      const regex = new RegExp(`(\\d+)\\s+${item}|${item}\\s+(\\d+)|(\\d+).*?${pluralMatch}`, "i");
      const match = allStepText.match(regex);
      if (match) quantity = parseFloat(match[1] || match[2] || match[3] || 1);
      
      recipe.ingredients.push({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        quantity: quantity,
        unit: ["water", "milk", "oil", "sauce", "vinegar", "broth", "stock", "wine", "cream", "juice", "honey", "syrup"].includes(item) ? "ml" : "pcs"
      });
    }
  });
  
  return recipe;
}

async function extractFullRecipeFromTranscript(transcript) {
  if (!transcript || transcript.length === 0) throw new Error("Empty transcript provided");
  
  if (!process.env.GEMINI_API_KEY) return fallbackWithRegex(transcript);

  const MAX_CHARS = 12000;
  let transcriptText = transcript.map(t => t.text).join(" ").slice(0, MAX_CHARS).replace(/\s+/g, " ").trim();
  
  const prompt = `
    You are a world-class culinary author and Michelin-star editor.
    Convert this transcript into a professional, technical recipe instructions.

    STRICT GRAMMAR & STYLE RULES:
    1. EXILE FIRST PERSON: NO "I", "me", "my", "we", "us", or "our". Never speak about the cook.
    2. IMPERATIVE TONE: Use 100% professional textbook giving-instruction style.
    3. FIRST STEP LEAD-IN: Always start the very first step with "Start by" or "Begin by".
    4. ACTION VERBS: Prepend "Add" if a sentence starts with an ingredient or quantity.
    5. PROFESSIONAL PHRASING: Use "Blend", "Transfer", "Whisk", "Sear". Avoid conversational chatter.
    6. MERGE FRAGMENTS: Combine related short sentences into a single, cohesive instruction.
    7. TECHNICAL PHRASING: Use specific descriptors (e.g., "until softened and translucent," "Set aside").
    8. RECONCILIATION: EVERY ingredient mentioned in a step MUST have a corresponding entry in the ingredients array. No omissions.

    FOLLOW THESE EXACT EXAMPLES:
    - Style 1: "Start by heating olive oil in a large skillet over medium-high heat. Add diced onions and sauté for 5 minutes, or until softened and translucent."
    - Style 2: "In a medium bowl, whisk together the flour, baking powder, and salt. Set aside."
    - Style 3: "Transfer the mixture to a blender and blend until smooth."

    Now process:
    ${transcriptText}

    RESULT FORMAT (JSON ONLY):
    {
      "name": "Professional Dish Name",
      "ingredients": [{ "name": "Main Noun Only", "quantity": 1, "unit": "tsp/tbsp/cup/gram/ml/pcs" }],
      "instructions": "Use specific units like 'ml' for liquids and 'g' for powders. Avoid 'pcs' for items that are measured by weight or volume."
    }
  `;

  try {
    let resultText = "";
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const response = await axios.post(url, 
        { 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.1, 
            topP: 0.6,
            maxOutputTokens: 2000
          }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (apiError) {
      console.warn("AI Tunnel Failed. Falling back to Expert-Engine...", apiError.message);
      return fallbackWithRegex(transcript);
    }

    if (!resultText) throw new Error("Empty response from AI");
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid output format from AI.");
    
    const recipe = JSON.parse(jsonMatch[0]);
    recipe.steps = cleanSteps(recipe.steps);
    
    // Safety Scanner: Recover any ingredients mentioned in steps but missing from the list
    const reconciledRecipe = reconcileRecipe(recipe);
    
    // Culinary Sanity Guard: Fix absurd quantities like "1 cup salt"
    reconciledRecipe.ingredients = sanitizeIngredients(reconciledRecipe.ingredients);
    
    return reconciledRecipe;
  } catch (error) {
    console.warn("AI reconstruction failed. Using Expert-Engine Backup.");
    return fallbackWithRegex(transcript);
  }
}

/**
 * CULINARY SANITY GUARD: Identify and fix absurd ingredient/unit combinations.
 */
function sanitizeIngredients(ingredients) {
  if (!ingredients || !Array.isArray(ingredients)) return [];

  return ingredients.map(ing => {
    const name = (ing.name || "").toLowerCase();
    const unit = (ing.unit || "").toLowerCase();
    const qty = ing.quantity || 0;

    // SINGLE SOURCE OF TRUTH: Apply Exhaustive Culinary Mapping & Security Guards
    const normalized = normalizeCulinaryUnit(name, unit, qty);
    
    return { 
      ...ing, 
      name: ing.name, // Keep original casing here if needed, or normalize to match DB
      quantity: normalized.quantity, 
      unit: normalized.unit 
    };
  });
}

module.exports = {
  extractFullRecipeFromTranscript
};

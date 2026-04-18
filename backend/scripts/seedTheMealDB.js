// backend/scripts/seedTheMealDB.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

// Pre-defined list of cuisines to pull from
const cuisines = ["Italian", "Mexican", "Indian", "Chinese", "French", "Thai", "Japanese", "Greek", "Spanish", "Middle Eastern"];

async function fetchRandomMeal() {
  const response = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
  const data = await response.json();
  return data.meals[0];
}

function parseSteps(instructions) {
  if (!instructions) return [];
  
  // Clean up formatting
  let cleanInst = instructions
    .replace(/\r\n/g, "\n")
    .replace(/(\d+)\./g, "$1") // strip inline numbers to avoid bad period splitting
    .replace(/(http|www)[^\s]+/gi, "") // strip URLs
    .replace(/recipe by.*/gi, "")
    .trim();

  // Try splitting by explicit newlines first
  let rawSteps = cleanInst.split(/\n+/);
  
  // If fewer than 4 newlines, it's probably one block of text, split by periods
  if (rawSteps.length < 4) {
      rawSteps = cleanInst.split(/(?<=\.)\s+/);
  }

  const steps = [];
  let timeTicker = 0;
  
  for (let s of rawSteps) {
    let text = s.trim().replace(/^STEP \d+/i, "").replace(/^\d+[\.\)]\s*/, "").trim();
    
    // Junk filters
    const isJunk = /^(enjoy|serve hot|serve immediately|notes|tips)/i.test(text.slice(0, 20));
    
    // Must be a substantial instructional step (min 25 characters, actually contains letters)
    if (text.length >= 25 && /[a-zA-Z]{10,}/.test(text) && !isJunk) {
      // Ensure sentence capitalization
      text = text.charAt(0).toUpperCase() + text.slice(1);
      
      steps.push({
        text: text,
        startTime: timeTicker
      });
      timeTicker += 60;
    }
  }
  
  return steps;
}

function extractIngredients(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingName = meal[`strIngredient${i}`];
    const ingMeasure = meal[`strMeasure${i}`];
    
    if (ingName && ingName.trim() !== "") {
      let unit = "g";
      let quantity = 1;
      
      const measureStr = (ingMeasure || "").toLowerCase().trim();
      if (measureStr) {
          const match = measureStr.match(/^([\d\.\/]+)\s*(.*)$/);
          if (match) {
             quantity = parseFloat(eval(match[1].replace("/", ".")) || 1); 
             unit = match[2].trim() || "pcs";
          } else {
             unit = measureStr;
          }
      }
      
      ingredients.push({
        name: ingName.trim().substring(0, 30),
        quantity: Math.max(0.1, quantity),
        unit: unit.substring(0, 15).replace(/[^a-zA-Z ]/g, "").trim() || "pcs"
      });
    }
  }
  return ingredients;
}

async function seed() {
  try {
    const remoteUri = process.env.MONGO_URI;
    const localUri = "mongodb://127.0.0.1:27017/smartpantry";
    
    console.log("Attempting to connect to MongoDB...");
    try {
      if (remoteUri) {
        await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to Remote MongoDB!");
      } else {
        throw new Error("No remote URI found");
      }
    } catch (remoteErr) {
      console.warn("Remote connection failed, trying local:", remoteErr.message);
      await mongoose.connect(localUri);
      console.log("Connected to Local MongoDB!");
    }

    console.log("Purging all existing recipes to ensure a clean state...");
    await Recipe.deleteMany({});
    
    const allIngs = await Ingredient.find({});
    const ingMap = new Map(allIngs.map(i => [i.name.toLowerCase(), i._id]));
    
    const results = [];
    const seenNames = new Set();
    let attempts = 0;
    
    console.log("Fetching 50 highly-professional recipes from TheMealDB...");
    
    while (results.length < 50 && attempts < 500) {
      attempts++;
      
      const meal = await fetchRandomMeal();
      if (!meal) continue;
      if (seenNames.has(meal.strMeal)) continue;
      
      // Strict rule: raw instructions must be meaty
      if (!meal.strInstructions || meal.strInstructions.length < 300) continue;
      
      const steps = parseSteps(meal.strInstructions);
      
      // Strict > 4 *real* steps rule
      if (steps.length < 4) {
          continue;
      }
      
      const rawIngredients = extractIngredients(meal);
      if (rawIngredients.length < 3) continue; // skip very basic ones
      
      const ings = [];
      for (const ing of rawIngredients) {
        let ingId = ingMap.get(ing.name.toLowerCase());
        if (!ingId) {
          const newIng = await Ingredient.findOneAndUpdate(
            { name: ing.name.toLowerCase() },
            { $setOnInsert: { name: ing.name.toLowerCase(), category: "Other", defaultUnit: ing.unit } },
            { upsert: true, new: true }
          );
          ingId = newIng._id;
          ingMap.set(ing.name.toLowerCase(), ingId);
        }
        ings.push({ ...ing, ingredientId: ingId });
      }

      const mealTypeMap = {
        "Breakfast": "breakfast",
        "Starter": "snack",
        "Dessert": "snack",
      };

      const recipeDoc = {
        name: meal.strMeal,
        description: `An authentic ${meal.strArea || "Global"} ${meal.strCategory || "dish"} featuring rich, vibrant flavors. Perfectly portioned and professionally crafted.`,
        cuisine: meal.strArea || "Global",
        diet: meal.strCategory === "Vegetarian" || meal.strCategory === "Vegan" ? meal.strCategory : "Balanced",
        imageUrl: meal.strMealThumb,
        prepMinutes: Math.floor(Math.random() * 40) + 15, // random 15-55 mins
        calories: Math.floor(Math.random() * 500) + 300, // random 300-800
        servings: Math.floor(Math.random() * 4) + 2, // 2-6
        ingredients: ings,
        steps: steps,
        mealType: mealTypeMap[meal.strCategory] || "dinner",
        status: "published"
      };

      results.push(recipeDoc);
      seenNames.add(meal.strMeal);
      
      // Live progress
      if (results.length % 5 === 0) {
         console.log(`Successfully parsed ${results.length}/50 recipes...`);
      }
    }

    if (results.length > 0) {
        console.log(`Saving ${results.length} professional, multi-step recipes to DB...`);
        await Recipe.insertMany(results);
        console.log("Recipes seeded successfully! 🎉");
    } else {
        console.log("Failed to find any matching recipes.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();

const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
require("dotenv").config();

// Standard Nutritional Mapping (Per 1g mass/volume OR per 1 unit)
// MACRO-ONLY: Calories are derived via (P*4 + C*4 + F*9)
const nutritionMap = {
  "asparagus": { protein: 0.2, carbs: 0.39, fat: 0.01, defaultUnit: "g" },
  "avocado": { protein: 0.02, carbs: 0.085, fat: 0.147, gramsPerUnit: 170, defaultUnit: "pcs" },
  "baby potatoes": { protein: 0.02, carbs: 0.17, fat: 0.001, gramsPerUnit: 30, defaultUnit: "pcs" },
  "baking powder": { protein: 0, carbs: 0.28, fat: 0, defaultUnit: "tsp" },
  "banana": { protein: 0.011, carbs: 0.23, fat: 0.003, gramsPerUnit: 120, defaultUnit: "pcs" },
  "basil": { protein: 0.032, carbs: 0.027, fat: 0.006, defaultUnit: "g" },
  "beef": { protein: 0.26, carbs: 0, fat: 0.15, defaultUnit: "g" },
  "steak": { protein: 0.26, carbs: 0, fat: 0.15, defaultUnit: "g" },
  "lamb": { protein: 0.25, carbs: 0, fat: 0.20, defaultUnit: "g" },
  "ground turkey": { protein: 0.24, carbs: 0, fat: 0.08, defaultUnit: "g" },
  "turkey": { protein: 0.28, carbs: 0, fat: 0.07, defaultUnit: "g" },
  "salmon": { protein: 0.20, carbs: 0, fat: 0.13, defaultUnit: "g" },
  "shrimp": { protein: 0.24, carbs: 0.01, fat: 0.003, defaultUnit: "g" },
  "fish": { protein: 0.20, carbs: 0, fat: 0.02, defaultUnit: "g" },
  "tofu": { protein: 0.08, carbs: 0.02, fat: 0.04, defaultUnit: "g" },
  "egg": { protein: 0.13, carbs: 0.011, fat: 0.11, gramsPerUnit: 50, defaultUnit: "pcs" },
  "butter": { protein: 0.009, carbs: 0.001, fat: 0.81, defaultUnit: "g" },
  "cheese": { protein: 0.25, carbs: 0.013, fat: 0.33, defaultUnit: "g" },
  "cheddar cheese": { protein: 0.25, carbs: 0.013, fat: 0.33, defaultUnit: "g" },
  "ricotta": { protein: 0.11, carbs: 0.03, fat: 0.13, defaultUnit: "cup" },
  "mozzarella": { protein: 0.22, carbs: 0.02, fat: 0.22, defaultUnit: "g" },
  "parmesan": { protein: 0.35, carbs: 0.04, fat: 0.25, defaultUnit: "g" },
  "milk": { protein: 0.034, carbs: 0.05, fat: 0.01, defaultUnit: "ml" },
  "yogurt": { protein: 0.1, carbs: 0.036, fat: 0.004, defaultUnit: "g" },
  "olive oil": { protein: 0, carbs: 0, fat: 1, defaultUnit: "tbsp" },
  "vegetable oil": { protein: 0, carbs: 0, fat: 1, defaultUnit: "tbsp" },
  "mustard oil": { protein: 0, carbs: 0, fat: 1, defaultUnit: "tbsp" },
  "rice": { protein: 0.027, carbs: 0.28, fat: 0.003, defaultUnit: "cup" },
  "basmati rice": { protein: 0.03, carbs: 0.28, fat: 0.003, defaultUnit: "cup" },
  "flour": { protein: 0.10, carbs: 0.76, fat: 0.01, defaultUnit: "cup" },
  "pasta": { protein: 0.05, carbs: 0.25, fat: 0.01, defaultUnit: "g" },
  "spaghetti": { protein: 0.05, carbs: 0.25, fat: 0.01, defaultUnit: "g" },
  "noodles": { protein: 0.04, carbs: 0.25, fat: 0.01, defaultUnit: "g" },
  "quinoa": { protein: 0.04, carbs: 0.21, fat: 0.019, defaultUnit: "cup" },
  "black beans": { protein: 0.08, carbs: 0.20, fat: 0.005, defaultUnit: "cup" },
  "lentils": { protein: 0.09, carbs: 0.20, fat: 0.004, defaultUnit: "cup" },
  "chickpeas": { protein: 0.09, carbs: 0.27, fat: 0.026, defaultUnit: "cup" },
  "bread": { protein: 0.09, carbs: 0.49, fat: 0.03, gramsPerUnit: 30, defaultUnit: "pcs" },
  "potato": { protein: 0.02, carbs: 0.17, fat: 0.001, gramsPerUnit: 170, defaultUnit: "pcs" },
  "onion": { protein: 0.011, carbs: 0.093, fat: 0.001, gramsPerUnit: 110, defaultUnit: "pcs" },
  "garlic": { protein: 0.064, carbs: 0.33, fat: 0.005, gramsPerUnit: 5, defaultUnit: "clove" },
  "tomato": { protein: 0.009, carbs: 0.039, fat: 0.002, gramsPerUnit: 120, defaultUnit: "pcs" },
  "bell pepper": { protein: 0.01, carbs: 0.06, fat: 0.003, gramsPerUnit: 120, defaultUnit: "pcs" },
  "carrot": { protein: 0.009, carbs: 0.096, fat: 0.002, gramsPerUnit: 60, defaultUnit: "pcs" },
  "broccoli": { protein: 0.028, carbs: 0.07, fat: 0.004, defaultUnit: "g" },
  "spinach": { protein: 0.029, carbs: 0.036, fat: 0.004, defaultUnit: "g" },
  "lemon": { protein: 0.011, carbs: 0.09, fat: 0.003, gramsPerUnit: 60, defaultUnit: "pcs" },
  "zucchini": { protein: 0.012, carbs: 0.031, fat: 0.003, gramsPerUnit: 200, defaultUnit: "pcs" },
  "sugar": { protein: 0, carbs: 1, fat: 0, defaultUnit: "tbsp" },
  "honey": { protein: 0.003, carbs: 0.82, fat: 0, defaultUnit: "tbsp" },
  "soy sauce": { protein: 0.08, carbs: 0.049, fat: 0.006, defaultUnit: "tbsp" },
  "sauce": { protein: 0.01, carbs: 0.10, fat: 0.02, defaultUnit: "tbsp" },
  "salt": { protein: 0, carbs: 0, fat: 0, defaultUnit: "tsp" },
  "water": { protein: 0, carbs: 0, fat: 0, defaultUnit: "ml" }
};

async function seedNutrition() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Master Macro Seeding...");

    const ingredients = await Ingredient.find();
    let updatedCount = 0;

    for (const ing of ingredients) {
      const name = ing.name.toLowerCase();
      let match = null;
      for (const [key, value] of Object.entries(nutritionMap)) {
        if (name.includes(key)) {
          match = value;
          break;
        }
      }

      if (match) {
        ing.protein = match.protein;
        ing.carbs = match.carbs;
        ing.fat = match.fat;
        ing.gramsPerUnit = match.gramsPerUnit || 0;
        await ing.save();
        updatedCount++;
        console.log(`Updated [${ing.name}]: P=${match.protein}g, C=${match.carbs}g, F=${match.fat}g`);
      }
    }

    console.log(`Master Expansion complete. Updated ${updatedCount} ingredients.`);
    process.exit(0);
  } catch (err) {
    console.error("Master Seeding failed:", err);
    process.exit(1);
  }
}

seedNutrition();

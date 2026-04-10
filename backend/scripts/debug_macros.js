const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");
const Ingredient = require("../src/models/Ingredient");
const { normalizeQuantity } = require("../src/services/nutrition.service");
require("dotenv").config();

async function traceMacros() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Surgical Audit...");

    const recipe = await Recipe.findOne({ name: /Classic Potato Recipe/i });
    if (!recipe) {
      console.log("Recipe 'Classic Potato Recipe' not found.");
      process.exit(0);
    }

    console.log(`\n--- SURGICAL AUDIT: ${recipe.name} ---`);
    console.log(`Servings: ${recipe.servings}`);
    console.log(`Reported Calories: ${recipe.calories}\n`);

    let checkTotal = 0;

    for (const item of recipe.ingredients) {
      const ing = await Ingredient.findById(item.ingredientId);
      if (!ing) {
        console.log(`[${item.name}] ERROR: IngredientId ${item.ingredientId} not found in DB.`);
        continue;
      }

      const qty = normalizeQuantity(item.quantity, item.unit);
      const unitLower = (item.unit || "").toLowerCase();
      
      const isMassVolume = [
        "g", "gram", "grams", 
        "ml", "milliliter", "milliliters", "millilitre", "millilitres",
        "kg", "kilogram", "kilograms",
        "l", "liter", "liters", "litre", "litres",
        "tsp", "teaspoon", "teaspoons",
        "tbsp", "tablespoon", "tablespoons",
        "cup", "cups"
      ].includes(unitLower);

      const factor = isMassVolume ? qty / 100 : item.quantity;
      const calories = (ing.calories || 0) * factor;
      checkTotal += calories;

      console.log(`Item: ${item.name}`);
      console.log(`  - Input Qty: ${item.quantity} ${item.unit || "(no unit)"}`);
      console.log(`  - Normalized Qty: ${qty}`);
      console.log(`  - Is Mass/Volume: ${isMassVolume}`);
      console.log(`  - Factor: ${factor.toFixed(4)}`);
      console.log(`  - Ingredient Density (per 100g/item): ${ing.calories} kcal`);
      console.log(`  - Contribution: ${calories.toFixed(2)} kcal`);
      console.log("------------------------------------------");
    }

    console.log(`\nVerified Sum: ${Math.round(checkTotal)} kcal`);
    console.log(`Per Serving (${recipe.servings}): ${Math.round(checkTotal / recipe.servings)} kcal`);

    process.exit(0);
  } catch (err) {
    console.error("Audit failed:", err);
    process.exit(1);
  }
}

traceMacros();

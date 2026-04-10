const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");
require("dotenv").config();

async function syncMacros() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for global macro sync...");

    const recipes = await Recipe.find();
    console.log(`Found ${recipes.length} recipes to sync.`);

    let syncedCount = 0;
    for (const recipe of recipes) {
      try {
        // Triggering the pre-save hook by re-marking ingredients as modified
        recipe.markModified("ingredients");
        await recipe.save();
        syncedCount++;
        console.log(`Synced [${recipe.name}]: ${recipe.calories} kcal, ${recipe.protein}g protein`);
      } catch (err) {
        console.error(`Failed to sync [${recipe.name}]:`, err.message);
      }
    }

    console.log(`Global sync complete. Synced ${syncedCount} recipes.`);
    process.exit(0);
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

syncMacros();

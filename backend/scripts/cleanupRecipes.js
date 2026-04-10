// backend/scripts/cleanupRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");

async function cleanup() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartpantry";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Cleanup...");

    // Find recipes that are:
    // 1. Using "Generic Ingredient"
    // 2. Have only 1 step "Watch the video for step-by-step instructions!"
    // 3. Name or description matches "placeholder" behavior
    const badRecipes = await Recipe.find({
      $or: [
        { "ingredients.name": { $regex: /generic ingredient/i } },
        { "steps.text": { $regex: /watch the video/i } },
        { steps: { $size: 1 } },
        { steps: { $size: 0 } }
      ]
    });

    console.log(`Found ${badRecipes.length} low-quality/generic recipes to delete.`);

    if (badRecipes.length > 0) {
        const result = await Recipe.deleteMany({ _id: { $in: badRecipes.map(r => r._id) } });
        console.log(`Successfully deleted ${result.deletedCount} recipes.`);
    } else {
        console.log("No low-quality recipes found to delete.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();

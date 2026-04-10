// backend/scripts/seedHistory.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const CookingLog = require("../src/models/CookingLog");
const Recipe = require("../src/models/Recipe");
const User = require("../src/models/User");

async function seedHistory() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Find the primary user (adjust as needed)
    const user = await User.findOne({ role: "user" }) || await User.findOne();
    if (!user) throw new Error("No user found to seed history for.");
    
    console.log(`Seeding history for user: ${user.username}`);

    // 2. Clear existing logs for a clean visual
    await CookingLog.deleteMany({ userId: user._id });

    // 3. Find some reliable recipes
    const recipes = await Recipe.find({ status: "published" }).limit(10);
    if (recipes.length === 0) throw new Error("No recipes found to seed logs.");

    const logs = [];
    // 4. Create 10 logs over the last 10 days
    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
      
      logs.push({
        userId: user._id,
        recipeId: randomRecipe._id,
        ingredientsUsed: randomRecipe.ingredients,
        performedAt: date,
        createdAt: date,
        updatedAt: date
      });
    }

    await CookingLog.insertMany(logs);
    console.log(`Successfully seeded ${logs.length} cooking logs.`);
    process.exit(0);
  } catch (err) {
    console.error("Seed History Error:", err);
    process.exit(1);
  }
}

seedHistory();

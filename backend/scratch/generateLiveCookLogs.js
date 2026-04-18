const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const CookingLog = require('../src/models/CookingLog');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const userId = "696a11b224c2d94833829de1"; // The user from your dashboard
  
  // 1. Find some existing recipes
  const recipes = await Recipe.find({ status: 'published' }).limit(5);
  if (recipes.length === 0) {
    console.log('No published recipes found to simulate cooking.');
    process.exit();
  }
  
  console.log(`Generating live cooking history for ${recipes.length} recipes...`);
  
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const cookCount = 5 - i; // Make the first one "Most Cooked" (5 times)
    
    for (let j = 0; j < cookCount; j++) {
      await CookingLog.create({
        userId,
        recipeId: recipe._id,
        ingredientsUsed: recipe.ingredients || [],
        performedAt: new Date(Date.now() - (j * 24 * 60 * 60 * 1000)) // spread over days
      });
    }
    console.log(`- Generated ${cookCount} logs for: ${recipe.name}`);
  }
  
  console.log('\nSuccess! Your Admin Dashboard should now show real performers.');
  process.exit();
}
test();

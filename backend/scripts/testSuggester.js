// backend/scripts/testSuggester.js
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");
const PantryItem = require("../src/models/PantryItem");

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smartpantry');
  const pantry = await PantryItem.find().lean();
  const selectedIds = pantry.map(p => String(p.ingredientId));
  
  const recipes = await Recipe.find({ status: "published" }).lean();
  
  const suggested = recipes.map(recipe => {
      // Ensure we compare strings
      const recipeIngredientIds = recipe.ingredients.map(ing => String(ing.ingredientId));
      console.log("Recipe:", recipe.name, recipeIngredientIds);
      const matchedIngredients = selectedIds.filter(id => recipeIngredientIds.includes(String(id)));
      
      const matchPercentage = recipe.ingredients.length > 0 
        ? Math.round((matchedIngredients.length / recipe.ingredients.length) * 100)
        : 0;

      return {
        name: recipe.name,
        matchPercentage,
        matchedCount: matchedIngredients.length
      };
    })
    .filter(recipe => recipe.matchedCount > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage || b.matchedCount - a.matchedCount);
    
  console.log("Selected IDs:", selectedIds);
  console.log("Suggested:", suggested);
  process.exit();
}
run();

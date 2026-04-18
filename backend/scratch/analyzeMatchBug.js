const mongoose = require('mongoose');
const Recipe = require('../src/models/Recipe');
const Ingredient = require('../src/models/Ingredient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartpantry';
  await mongoose.connect(uri);

  console.log('--- REFRESHING DATA CHECK ---');
  
  // 1. Check for Duplicate Ingredients by Name
  const dupIngs = await Ingredient.aggregate([
    { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (dupIngs.length > 0) {
    console.log('FOUND DUPLICATE INGREDIENTS:');
    dupIngs.forEach(d => console.log(` - "${d._id}": ${d.count} entries found. IDs: ${d.ids.join(', ')}`));
  } else {
    console.log('No duplicate ingredients found by name.');
  }

  // 2. Sample Recipe Check (SuggestRecipes Logic)
  const recipe = await Recipe.findOne({ status: 'published' }).lean();
  if (recipe) {
    console.log(`\nAnalyzing Recipe: "${recipe.name}"`);
    console.log('Ingredients:');
    recipe.ingredients.forEach(i => console.log(` - ${i.name} (ID: ${i.ingredientId})`));
    
    const ids = recipe.ingredients.map(i => String(i.ingredientId)).filter(id => id !== 'null');
    const uniqueIds = [...new Set(ids)];
    console.log(`Summary: Total Ingredients: ${recipe.ingredients.length}, Unique IDs: ${uniqueIds.length}`);
    
    if (uniqueIds.length < recipe.ingredients.length) {
       console.log('WARNING: This recipe has duplicate ingredient IDs or missing IDs.');
    }
  }

  process.exit();
}
run().catch(err => { console.error(err); process.exit(1); });

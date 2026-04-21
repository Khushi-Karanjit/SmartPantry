
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const ings = await mongoose.connection.db.collection('ingredients').distinct('defaultUnit');
  const pantry = await mongoose.connection.db.collection('pantryitems').distinct('unit');
  
  // Aggregate unique units from the ingredients array inside recipes
  const recipeUnitsAgg = await mongoose.connection.db.collection('recipes').aggregate([
    { $unwind: '$ingredients' },
    { $group: { _id: '$ingredients.unit' } }
  ]).toArray();
  
  const recipeUnits = recipeUnitsAgg.map(r => r._id);

  console.log('--- Current Data Standards ---');
  console.log('Ingredient Units:', ings);
  console.log('Pantry Units:', pantry);
  console.log('Recipe Units:', recipeUnits);

  // Check for common non-SI units
  const allUnits = new Set([...ings, ...pantry, ...recipeUnits]);
  const allowed = ['g', 'kg', 'ml', 'l', 'pcs'];
  const disallowed = [...allUnits].filter(u => !allowed.includes(u));

  console.log('\n--- Disallowed Units Detected ---');
  console.log(disallowed);

  process.exit();
}

run();

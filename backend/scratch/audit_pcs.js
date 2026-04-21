
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Ingredient = require('../src/models/Ingredient');
  
  const ings = await Ingredient.find({ defaultUnit: 'pcs' }).sort({ category: 1, name: 1 }).lean();
  
  console.log('--- Ingredients remaining in PCS ---');
  ings.forEach(i => {
    console.log(`${i.category.padEnd(15)} | ${i.name}`);
  });

  process.exit();
}

run();

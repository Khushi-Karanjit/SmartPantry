
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Category = require('../src/models/Category');
  const Ingredient = require('../src/models/Ingredient');
  const PantryItem = require('../src/models/PantryItem');

  console.log('Categories:');
  const cats = await Category.find();
  cats.forEach(c => console.log(`- ${c.name}: ${c.shelfLifeDays} days`));

  console.log('\nIngredients in question:');
  const ings = await Ingredient.find({ name: { $in: ['FRESH GINGER', 'SRIRACHA', 'BOK CHOY'] } });
  ings.forEach(i => console.log(`- ${i.name}: ${i.shelfLifeDays} days (Category: ${i.category})`));

  process.exit();
}

run();

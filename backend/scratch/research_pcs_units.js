
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Ingredient = require('../src/models/Ingredient');
  const PantryItem = require('../src/models/PantryItem');

  const names = ['FRESH GINGER', 'GOCHUJANG', 'MISO PASTE', 'BOK CHOY'];
  console.log('--- Current Data ---');
  
  for (const name of names) {
    const ing = await Ingredient.findOne({ name });
    const pItems = await PantryItem.find({ name });
    console.log(`Ingredient: ${name} | Default Unit: ${ing?.defaultUnit}`);
    pItems.forEach(p => console.log(`  PantryItem: ${p.quantity} ${p.unit}`));
  }

  process.exit();
}

run();


const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Ingredient = require('../src/models/Ingredient');
  const PantryItem = require('../src/models/PantryItem');
  
  console.log('--- Verification Report ---');
  
  // 1. Expiry Check
  const ginger = await Ingredient.findOne({ name: 'FRESH GINGER' });
  console.log('Ginger Shelf Life:', ginger?.shelfLifeDays, '(Expected: undefined/null)');

  // 2. Unit Whitelist Check
  const units = await PantryItem.distinct('unit');
  console.log('Unique Pantry Units:', units, '(Expected only SI + pcs)');

  // 3. Deduction Test (Simulated)
  const { standardizeForDeduction } = require('../src/services/unit.service');
  const deduction = standardizeForDeduction(1, 'tbsp', 'g', 'Spices');
  console.log('1 tbsp Sugar (Spices) standardized to gram:', deduction, '(Expected: 15)');

  process.exit();
}

run();

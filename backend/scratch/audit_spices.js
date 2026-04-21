
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Ingredient = require('../src/models/Ingredient');
  
  const ings = await Ingredient.find({ 
    category: { $in: ['Spices', 'Herbs'] }, 
    defaultUnit: 'pcs' 
  }).sort({ name: 1 }).lean();
  
  console.log('--- Spices/Herbs in PCS ---');
  ings.forEach(i => {
    console.log(i.name);
  });

  process.exit();
}

run();

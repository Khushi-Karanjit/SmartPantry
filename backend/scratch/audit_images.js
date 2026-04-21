
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Recipe = require('../src/models/Recipe');
  
  const recipes = await Recipe.find({}).select('name imageUrl').lean();
  
  console.log('--- Current Recipes & Images ---');
  recipes.forEach(r => {
    console.log(`${r.name.padEnd(40)} | ${r.imageUrl}`);
  });

  process.exit();
}

run();

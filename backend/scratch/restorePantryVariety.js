const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const Category = require('../src/models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const items = await PantryItem.find().populate('ingredientId').populate('categoryId');
  console.log(`Restoring variety for ${items.length} items...`);
  
  for (const item of items) {
    const cat = item.categoryId || {};
    const ing = item.ingredientId || {};
    const shelfLife = ing.shelfLifeDays || cat.shelfLifeDays || 30;
    
    const rand = Math.random();
    let AgePercent;
    
    if (rand < 0.7) {
      // 70% Fresh: Somewhere between 10% and 50% of shelf life
      AgePercent = 0.1 + (Math.random() * 0.4);
    } else if (rand < 0.9) {
      // 20% Soon (Urgent): Somewhere between 90% and 98% of shelf life
      AgePercent = 0.9 + (Math.random() * 0.08);
    } else {
      // 10% Expired: Somewhere between 105% and 120% of shelf life
      AgePercent = 1.05 + (Math.random() * 0.15);
    }
    
    const targetAddedAt = new Date();
    targetAddedAt.setHours(targetAddedAt.getHours() - (shelfLife * AgePercent * 24));
    
    await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: targetAddedAt } });
  }
  
  console.log('\nSuccess! Pantry variety restored.');
  process.exit();
}
test();

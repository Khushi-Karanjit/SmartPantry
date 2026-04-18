const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const Category = require('../src/models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function daysUntil(dateIso) {
  const now = new Date();
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const items = await PantryItem.find().populate('ingredientId').populate('categoryId');
  console.log(`Checking ${items.length} items...`);
  
  for (const item of items) {
    const cat = item.categoryId || {};
    const ing = item.ingredientId || {};
    const shelfLife = ing.shelfLifeDays || cat.shelfLifeDays || 30;
    
    // Set addedAt so it expires in exactly 1.5 days (ensuring d=2 with ceil)
    const targetAddedAt = new Date();
    targetAddedAt.setHours(targetAddedAt.getHours() - ((shelfLife - 1.5) * 24));
    
    await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: targetAddedAt } });
    
    // Verify
    const expiry = new Date(targetAddedAt);
    expiry.setDate(expiry.getDate() + shelfLife);
    const d = daysUntil(expiry.toISOString());
    console.log(`- ${item.name}: ShelfLife ${shelfLife}d, AddedAt ${targetAddedAt.toISOString()}, d=${d}`);
  }
  
  process.exit();
}
test();

const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  
  const items = await PantryItem.find().populate('ingredientId').limit(10);
  console.log(`Found ${items.length} items to check.`);
  
  for (const item of items) {
    const shelfLife = item.ingredientId?.shelfLifeDays || 30;
    
    // Set addedAt so it expires in exactly 1 day (24 hours).
    // Formula: Expiry = addedAt + shelfLife
    // Target: Expiry = now + 1 day
    // So: now + 1 day = addedAt + shelfLife
    // addedAt = now + 1 day - shelfLife
    
    const targetAddedAt = new Date();
    targetAddedAt.setDate(targetAddedAt.getDate() + 1 - shelfLife);
    
    await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: targetAddedAt } });
    console.log(`- Updated "${item.name}" (Shelf Life: ${shelfLife}d) -> AddedAt set to ${targetAddedAt.toDateString()}`);
  }
  
  console.log('\nSuccess! These items should now show up in "Soon" list (1 day remaining).');
  process.exit();
}
test();

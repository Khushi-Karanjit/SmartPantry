const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const userId = "696a11b224c2d94833829de1";
  const items = await PantryItem.find({ userId }).populate('ingredientId').limit(5);
  
  console.log(`Setting up ${items.length} urgent items for testing...`);
  
  // Dates for Soon (1, 2, 3 days from today)
  const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 10);
  const nextDay = new Date(Date.now() + 48*60*60*1000).toISOString().slice(0, 10);
  const thirdDay = new Date(Date.now() + 72*60*60*1000).toISOString().slice(0, 10);
  const urgentDates = [tomorrow, nextDay, thirdDay, tomorrow, nextDay];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const shelfLife = item.ingredientId?.shelfLifeDays || 30;
    const targetDate = urgentDates[i];
    
    // expiry = addedAt + shelfLife
    // addedAt = expiry - shelfLife
    const targetAddedAt = new Date(targetDate + "T10:00:00Z");
    targetAddedAt.setDate(targetAddedAt.getDate() - shelfLife);
    
    await PantryItem.updateOne({ _id: item._id }, { 
      $set: { 
        addedAt: targetAddedAt,
        name: `TEST URGENT - ${item.name}` 
      } 
    });
    
    console.log(`- Set '${item.name}' to expire on ${targetDate}`);
  }
  
  console.log('\nSuccess! Urgent items are ready.');
  process.exit();
}
test();

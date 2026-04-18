const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  
  const items = await PantryItem.find().limit(5);
  console.log(`Found ${items.length} items to manipulate.`);
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const oldDate = new Date();
    // Set to 28, 28.5, 29, 29.5 days ago to ensure some variety in the "Soon" window
    const daysAgo = 28 + (i * 0.4); 
    oldDate.setHours(oldDate.getHours() - (daysAgo * 24));
    
    await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: oldDate } });
    console.log(`- Set "${item.name}" addedAt to ${daysAgo.toFixed(1)} days ago.`);
  }
  
  console.log('\nSuccess! Check your Dashboard and Pantry soon sections.');
  process.exit();
}
test();

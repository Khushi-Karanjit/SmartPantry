const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function computeExpiryIso(baseDate, shelfLifeDays) {
  const base = new Date(baseDate);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays || 0));
  return expiry.toISOString();
}

function daysUntil(dateIso) {
  if (!dateIso) return 999;
  const todayStr = new Date().toISOString().slice(0, 10);
  const expiryStr = dateIso.slice(0, 10);
  if (expiryStr < todayStr) return -1;
  if (expiryStr === todayStr) return 0;
  const t = new Date(todayStr);
  const e = new Date(expiryStr);
  return Math.round((e.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
}

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find an "Urgent" item (expiry tomorrow)
  const tomorrowStr = new Date(Date.now() + 24*60*60*1000).toISOString().slice(0, 10);
  console.log(`Looking for item expiring on ${tomorrowStr}...`);
  
  const item = await PantryItem.findOne({ name: 'SALT', userId: '696a11b224c2d94833829de1' }).populate('ingredientId');
  if (!item) { console.log('Item salt not found'); process.exit(); }
  
  const shelfLife = item.ingredientId.shelfLifeDays || 30;
  // Set addedAt so it expires Tomorrow
  const targetAddedAt = new Date(tomorrowStr + "T00:00:00Z");
  targetAddedAt.setDate(targetAddedAt.getDate() - shelfLife);
  
  console.log(`Original addedAt: ${item.addedAt}`);
  await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: targetAddedAt } });
  
  // Now simulate the controller logic
  const freshItem = await PantryItem.findById(item._id);
  const base = freshItem.addedAt;
  const expiryDate = computeExpiryIso(base, shelfLife);
  const d = daysUntil(expiryDate);
  console.log(`Days Until: ${d}`);
  
  let status = 'standard';
  if (d <= 0) status = 'cleared';
  else if (d <= 3) status = 'urgent_merge';
  
  console.log(`Computed restockStatus: ${status}`);
  
  process.exit();
}
test();

const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const Ingredient = require('../src/models/Ingredient');
const Category = require('../src/models/Category');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function computeExpiryIso(baseDate, shelfLifeDays) {
  const base = new Date(baseDate);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + Number(shelfLifeDays || 0));
  return expiry.toISOString();
}

function daysUntil(dateIso) {
  if (!dateIso) return 0;
  const now = new Date();
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  const res = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return res;
}

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const userId = "696a11b224c2d94833829de1"; // The active user we found
  
  const allItems = await PantryItem.find({ userId }).populate("categoryId").populate("ingredientId").lean();
  console.log(`User has ${allItems.length} items.`);
  
  const mappedAll = allItems.map(it => {
    const cat = it.categoryId || {};
    const ingredient = it.ingredientId || {};
    const shelfLife = ingredient.shelfLifeDays || cat.shelfLifeDays || 30;
    const base = it.addedAt || it.createdAt || new Date();
    return { name: it.name, shelfLife, base, expiryDate: computeExpiryIso(base, shelfLife) };
  });

  const expiringSoon = mappedAll.filter(it => {
    const d = daysUntil(it.expiryDate);
    return d >= 0 && d <= 2;
  });

  console.log(`Found ${expiringSoon.length} items in 'Soon' logic.`);
  expiringSoon.forEach(it => {
    console.log(`- ${it.name}: d=${daysUntil(it.expiryDate)} (Expiry: ${it.expiryDate})`);
  });
  
  process.exit();
}
test();

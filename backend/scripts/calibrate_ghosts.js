require('dotenv').config();
const mongoose = require('mongoose');

async function calibrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const Recipe = require('../src/models/Recipe');
  
  const data = [
    { name: 'Pita and Hummus', calories: 280, protein: 10, carbs: 35, fat: 12 },
    { name: 'Cheese and Crackers', calories: 310, protein: 12, carbs: 22, fat: 20 },
    { name: 'Roast Beef Slices', calories: 180, protein: 25, carbs: 2, fat: 8 },
    { name: 'Breakfast Cereal', calories: 220, protein: 6, carbs: 45, fat: 2 }
  ];

  for (const item of data) {
    const res = await Recipe.updateOne(
      { name: item.name },
      { $set: { 
        calories: item.calories, 
        protein: item.protein, 
        carbs: item.carbs, 
        fat: item.fat 
      }}
    );
    console.log(`Updated ${item.name}: ${res.modifiedCount}`);
  }
  process.exit();
}

calibrate();

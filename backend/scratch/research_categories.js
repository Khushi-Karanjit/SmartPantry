
const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const ings = await mongoose.connection.db.collection('ingredients').find().sort({category: 1, name: 1}).toArray();
  
  console.log('--- Ingredient Categories ---');
  ings.forEach(i => {
    console.log(`${i.category.padEnd(15)} | ${i.name}`);
  });

  process.exit();
}

run();

const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const counts = await PantryItem.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);
  console.log(JSON.stringify(counts, null, 2));
  process.exit();
}
test();

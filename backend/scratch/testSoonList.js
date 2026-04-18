const mongoose = require('mongoose');
const PantryItem = require('../src/models/PantryItem');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function test() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  const item = await PantryItem.findOne();
  if (item) {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 29); // 29 days ago
    await PantryItem.updateOne({ _id: item._id }, { $set: { addedAt: oldDate } });
    console.log(`Manipulated "${item.name}" to appear in Soon list (set addedAt to 29 days ago)`);
  } else {
    console.log('No item found in pantry.');
  }
  process.exit();
}
test();

// backend/debugPantry.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const PantryItem = require("./src/models/PantryItem");
const Ingredient = require("./src/models/Ingredient");

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const u = await User.findOne({ username: /khushi/i });
  if (!u) { console.log("User not found"); process.exit(1); }
  
  const items = await PantryItem.find({ userId: u._id }).populate('ingredientId').lean();
  console.log(`Total items for khushi: ${items.length}`);
  items.forEach(it => {
    console.log(`${it.name}: ID=${it.ingredientId?._id}, IngName=${it.ingredientId?.name}`);
  });
  process.exit(0);
}

debug();

// backend/inspectKhushiPantry.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const PantryItem = require("./src/models/PantryItem");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ username: /khushi/i });
  if (user) {
    const items = await PantryItem.find({ userId: user._id }).lean();
    console.log(JSON.stringify(items.slice(0, 5), null, 2));
  }
  process.exit(0);
}

check();

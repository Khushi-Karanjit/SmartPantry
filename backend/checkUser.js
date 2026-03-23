// backend/checkUser.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const PantryItem = require("./src/models/PantryItem");

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ username: /khushi/i });
  if (user) {
    console.log("User found:", user.username, user.email, "Id:", user._id);
    const items = await PantryItem.find({ userId: user._id });
    console.log(`Pantry Items for ${user.username}: ${items.length}`);
    items.forEach(it => console.log(` - ${it.name} (${it.quantity} ${it.unit})`));
  } else {
    console.log("User 'khushi' not found.");
  }
  process.exit(0);
}

check();

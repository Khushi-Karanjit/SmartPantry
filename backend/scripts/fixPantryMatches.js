const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const PantryItem = require("../src/models/PantryItem");
const Ingredient = require("../src/models/Ingredient");

async function run() {
  const remoteUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/smartpantry";
  
  if (remoteUri) await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
  else await mongoose.connect(localUri);
  const items = await PantryItem.find().populate("ingredientId");
  let fixedCount = 0;
  
  for(const item of items) {
     if(!item.ingredientId || !item.ingredientId.name) {
         // fallback to matching by item.name
         const match = await Ingredient.findOne({ name: { $regex: new RegExp(`^${item.name}`, "i") } });
         if(match) {
            item.ingredientId = match._id;
            await item.save();
            fixedCount++;
         }
         continue;
     }

     const ingName = item.ingredientId.name;
     // Find the absolute cleanest, most recently used ingredient 
     // We can do this by checking if any recipe uses it, OR just by grabbing the exact match
     const bestMatch = await Ingredient.findOne({ name: { $regex: new RegExp(`^${ingName}$`, "i") } }).sort({ createdAt: -1 });
     if(bestMatch && bestMatch._id.toString() !== item.ingredientId._id.toString()) {
         item.ingredientId = bestMatch._id;
         await item.save();
         fixedCount++;
     }
  }
  console.log(`Relinked ${fixedCount} pantry items to clean ingredient IDs!`);
  process.exit();
}
run();

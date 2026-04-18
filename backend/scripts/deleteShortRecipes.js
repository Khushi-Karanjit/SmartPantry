// backend/scripts/deleteShortRecipes.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");

async function run() {
  const remoteUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/smartpantry";
  try {
    if (remoteUri) {
      await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 5000 });
    } else {
      await mongoose.connect(localUri);
    }
    
    // Attempt 1: Delete using MongoDB size expression
    try {
        const res = await Recipe.deleteMany({
          $expr: { $lt: [{ $size: { $ifNull: ["$steps", []] } }, 3] }
        });
        console.log(`Deleted ${res.deletedCount} recipes with less than 3 steps.`);
    } catch(err) {
        // Fallback: load all and check length
        const all = await Recipe.find({});
        let count = 0;
        for(const r of all) {
            if(!r.steps || r.steps.length < 3) {
                await Recipe.deleteOne({ _id: r._id });
                count++;
            }
        }
        console.log(`Manual fallback deleted ${count} recipes with less than 3 steps.`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

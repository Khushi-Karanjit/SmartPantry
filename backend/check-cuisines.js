require("dotenv").config();
const mongoose = require("mongoose");
const Recipe = require("./src/models/Recipe");

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const cuisines = await Recipe.distinct("cuisine");
    console.log("Unique Cuisines in DB:", cuisines);
    const publishedCuisines = await Recipe.distinct("cuisine", { status: "published" });
    console.log("Published Cuisines in DB:", publishedCuisines);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

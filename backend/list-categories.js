const mongoose = require("mongoose");
const Category = require("./src/models/Category");
require("dotenv").config();

async function listCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smartpantry");
    const cats = await Category.find().lean();
    console.log("Categories:", cats.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listCategories();

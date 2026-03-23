// backend/repairKhushiPantry.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const PantryItem = require("./src/models/PantryItem");
const Ingredient = require("./src/models/Ingredient");
const Category = require("./src/models/Category");

async function repair() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...");

  const user = await User.findOne({ username: /khushi/i });
  if (!user) {
    console.log("User khushi not found.");
    process.exit(1);
  }

  const items = await PantryItem.find({ userId: user._id });
  console.log(`Found ${items.length} items for khushi. Repairing...`);

  const cats = await Category.find().lean();
  const catMap = new Map(cats.map(c => [c.name.toLowerCase(), c._id]));
  const defaultCatId = catMap.get("other");

  for (const item of items) {
    let ingredient = await Ingredient.findOne({ name: item.name.toLowerCase() });
    
    if (!ingredient) {
      console.log(`Creating missing ingredient: ${item.name}`);
      ingredient = await Ingredient.create({
        name: item.name.toLowerCase(),
        category: "Other", // Default
        defaultUnit: item.unit || "pcs"
      });
    }

    item.ingredientId = ingredient._id;
    
    // Also ensure categoryId is set correctly
    if (!item.categoryId || !mongoose.Types.ObjectId.isValid(item.categoryId)) {
        const catId = catMap.get(ingredient.category.toLowerCase()) || defaultCatId;
        item.categoryId = catId;
    }

    await item.save();
    console.log(`Repaired: ${item.name} -> Ingredient ID: ${ingredient._id}`);
  }

  console.log("Repair complete!");
  process.exit(0);
}

repair();

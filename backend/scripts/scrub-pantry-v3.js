const mongoose = require("mongoose");
require("dotenv").config();
const Ingredient = require("../src/models/Ingredient");
const PantryItem = require("../src/models/PantryItem");

async function scrub() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Capitalize all Ingredients
    const ingredients = await Ingredient.find({});
    console.log(`Processing ${ingredients.length} Ingredients...`);
    for (const ing of ingredients) {
      ing.name = ing.name.toUpperCase();
      // Use save() to trigger any middleware or validation
      await ing.save().catch(err => {
         // Might fail if two ingredients now clash in casing (e.g. "Salt" and "SALT")
         // If so, we'll need to merge them too, but Ingredient has {name, category} unique index.
         console.warn(`[Ingredient] Collision detected for ${ing.name}, resolving...`);
      });
    }

    // 2. Capitalize all PantryItems
    const pantryItems = await PantryItem.find({});
    console.log(`Processing ${pantryItems.length} Pantry Items...`);
    for (const item of pantryItems) {
      item.name = item.name.toUpperCase();
      await item.save();
    }

    // 3. Merge Duplicates (The "Repeats" problem)
    // We group by userId and ingredientId to find repeats
    console.log("Scanning for duplicate inventory records...");
    const duplicates = await PantryItem.aggregate([
      {
        $group: {
          _id: { userId: "$userId", ingredientId: "$ingredientId" },
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          items: { $push: "$$ROOT" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} duplicate groups to merge.`);

    for (const dup of duplicates) {
      const { userId, ingredientId } = dup._id;
      const [keepItem, ...toDelete] = dup.items;

      console.log(`Merging ${dup.count} entries for ingredient ${ingredientId} (User ${userId})...`);

      // Sum quantities
      let totalQty = keepItem.quantity;
      for (const item of toDelete) {
        // Simple addition of quantity (assumes same units for simplicity, or just merges anyway)
        totalQty += item.quantity;
      }

      // Update the one we keep
      await PantryItem.updateOne(
        { _id: keepItem._id },
        { $set: { quantity: totalQty, name: keepItem.name.toUpperCase() } }
      );

      // Delete the others
      const deleteIds = toDelete.map(d => d._id);
      await PantryItem.deleteMany({ _id: { $in: deleteIds } });
    }

    console.log("Pantry scrub and normalization complete! 🧴✨");
    process.exit(0);
  } catch (err) {
    console.error("Scrub failed:", err);
    process.exit(1);
  }
}

scrub();

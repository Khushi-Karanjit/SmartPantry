const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");
const PantryItem = require("../src/models/PantryItem");

const MONGO_URI = "mongodb+srv://KK:happy07@professionals.qlmr3d5.mongodb.net/?retryWrites=true&w=majority&appName=Professionals";

async function consolidate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected...");

  const CANONICAL_ID = "69c4cdb358d60a6ef52a1514"; // BREAD (Bakery)
  const DUPE_ID = "69dca5137eef88e14a6891f2";      // BREAD (Other)
  const FRENCH_BREAD_ID = "69cd7ff0b63c9005e2b2d499"; // FRENCH BREAD (Other)

  // 1. Remap Recipes
  console.log("Remapping recipes...");
  const recipes = await Recipe.find({ "ingredients.ingredientId": DUPE_ID });
  for (const r of recipes) {
    r.ingredients.forEach(ing => {
      if (ing.ingredientId === DUPE_ID) ing.ingredientId = CANONICAL_ID;
    });
    await r.save();
  }
  console.log(`Updated ${recipes.length} recipes.`);

  // 2. Remap Pantry Items
  console.log("Remapping pantry items...");
  const resultPantry = await PantryItem.updateMany(
    { ingredientId: DUPE_ID },
    { $set: { ingredientId: CANONICAL_ID } }
  );
  console.log(`Updated ${resultPantry.nModified || resultPantry.modifiedCount} pantry items.`);

  // 3. Fix French Bread category
  console.log("Fixing French Bread category...");
  await Ingredient.updateOne({ _id: FRENCH_BREAD_ID }, { $set: { category: "Bakery" } });

  // 4. Delete Duplicate Bread
  console.log("Deleting duplicate bread...");
  await Ingredient.deleteOne({ _id: DUPE_ID });

  console.log("Consolidation finished.");
  process.exit(0);
}

consolidate().catch(err => {
  console.error(err);
  process.exit(1);
});

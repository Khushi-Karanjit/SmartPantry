/**
 * normalizeIngredientNames.js
 * 
 * One-time migration script to:
 * 1. Singularize all ingredient names (e.g., "APPLES" -> "APPLE")
 * 2. Merge duplicates (if "APPLES" and "APPLE" both exist, merge into "APPLE")
 * 3. Update PantryItem and Recipe references to point to the surviving ingredient
 * 4. Delete the now-orphaned plural ingredient entries
 * 
 * Run with: node src/scripts/normalizeIngredientNames.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Ingredient = require("../models/Ingredient");
const PantryItem = require("../models/PantryItem");
const Recipe = require("../models/Recipe");
const { singularize } = require("../utils/singularize");

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ No MONGO_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB\n");

  const allIngredients = await Ingredient.find({}).lean();
  console.log(`📦 Found ${allIngredients.length} ingredients total.\n`);

  let renamed = 0;
  let merged = 0;
  let skipped = 0;

  for (const ing of allIngredients) {
    const originalName = ing.name; // stored as UPPERCASE
    const singularLower = singularize(originalName.toLowerCase());
    const singularUpper = singularLower.toUpperCase();

    // No change needed
    if (singularUpper === originalName) {
      skipped++;
      continue;
    }

    console.log(`🔄 Processing: "${originalName}" → "${singularUpper}"`);

    // Check if the singular form already exists as a separate document
    const existingSingular = await Ingredient.findOne({
      name: singularUpper,
      _id: { $ne: ing._id }
    }).lean();

    if (existingSingular) {
      // MERGE: re-point all references to the existing singular, then delete this one
      console.log(`   ↳ MERGE: "${originalName}" → existing "${existingSingular.name}" (${existingSingular._id})`);

      // Re-point PantryItems
      const pantryResult = await PantryItem.updateMany(
        { ingredientId: ing._id },
        { $set: { ingredientId: existingSingular._id, name: singularUpper } }
      );
      console.log(`   ↳ PantryItems re-pointed: ${pantryResult.modifiedCount}`);

      // Re-point Recipe ingredients (array of subdocs)
      const recipes = await Recipe.find({ "ingredients.ingredientId": ing._id });
      for (const recipe of recipes) {
        let changed = false;
        recipe.ingredients = recipe.ingredients.map((ri) => {
          if (ri.ingredientId?.toString() === ing._id.toString()) {
            changed = true;
            return { ...ri, ingredientId: existingSingular._id, name: singularUpper };
          }
          return ri;
        });
        if (changed) await recipe.save();
      }
      console.log(`   ↳ Recipes re-pointed: ${recipes.length}`);

      // Delete the now-orphaned plural ingredient
      await Ingredient.deleteOne({ _id: ing._id });
      console.log(`   ↳ Deleted orphan: "${originalName}"\n`);

      merged++;
    } else {
      // RENAME in place - just update the name
      console.log(`   ↳ RENAME: "${originalName}" → "${singularUpper}"`);
      
      await Ingredient.updateOne(
        { _id: ing._id },
        { $set: { name: singularUpper } }
      );

      // Update PantryItem display names (denormalized)
      await PantryItem.updateMany(
        { ingredientId: ing._id },
        { $set: { name: singularUpper } }
      );

      // Update Recipe subdoc ingredient names
      const recipes = await Recipe.find({ "ingredients.ingredientId": ing._id });
      for (const recipe of recipes) {
        let changed = false;
        recipe.ingredients = recipe.ingredients.map((ri) => {
          if (ri.ingredientId?.toString() === ing._id.toString()) {
            changed = true;
            return { ...ri, name: singularUpper };
          }
          return ri;
        });
        if (changed) await recipe.save();
      }

      console.log(`   ↳ Updated ${recipes.length} recipe(s)\n`);
      renamed++;
    }
  }

  console.log("─────────────────────────────────");
  console.log(`✅ Migration complete!`);
  console.log(`   Renamed  : ${renamed}`);
  console.log(`   Merged   : ${merged}`);
  console.log(`   Unchanged: ${skipped}`);
  console.log("─────────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});


/**
 * backend/scripts/patch_spices_units.js
 * Fixes all ingredients in Spices/Herbs categories that are still 'pcs'.
 */

const mongoose = require("mongoose");
require("dotenv").config();
const { normalizeToSi } = require("../src/services/unit.service");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Ingredient = require("../src/models/Ingredient");
    const PantryItem = require("../src/models/PantryItem");
    const Recipe = require("../src/models/Recipe");

    console.log("Fixing all Spices and Herbs to use 'g' units...");

    // 1. Update Ingredients in Spices/Herbs categories
    const ings = await Ingredient.find({ 
      category: { $in: ['Spices', 'Herbs', 'Condiments'] },
      defaultUnit: 'pcs'
    });

    for (const ing of ings) {
      console.log(`Patching: ${ing.name}`);
      ing.defaultUnit = 'g';
      await ing.save();

      // 2. Update PantryItems
      await PantryItem.updateMany(
        { ingredientId: ing._id, unit: 'pcs' },
        { $set: { unit: 'g' } }
      );
    }

    // 3. Global Recipe Check (ensure no leftovers)
    const recipes = await Recipe.find();
    for (const r of recipes) {
      let changed = false;
      for (const ing of r.ingredients) {
        const si = normalizeToSi(ing.quantity, ing.unit, "Other");
        if (ing.unit !== si.unit) {
          ing.unit = si.unit;
          ing.quantity = si.quantity;
          changed = true;
        }
      }
      if (changed) {
        r.markModified("ingredients");
        await r.save();
      }
    }

    console.log("Spices Patch Complete!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

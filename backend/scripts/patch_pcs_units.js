
/**
 * backend/scripts/patch_pcs_units.js
 * Fixes ingredients that were incorrectly left as 'pcs' during standardization.
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Ingredient = require("../src/models/Ingredient");
    const PantryItem = require("../src/models/PantryItem");
    const Recipe = require("../src/models/Recipe");

    const toGram = [
      "FRESH GINGER", "GOCHUJANG", "MISO PASTE", "GINGER & GARLIC PASTE",
      "JEERA", "CHILI FLAKES", "TIMMUR", "FENUGREEK SEEDS (METHI)",
      "TURMERIC POWDER", "CUMIN & CORIANDER POWDER", "CLOVES", "STAR ANISE",
      "WHOLE DRY CHILIES", "PEPPER", "SALT", "HIMALAYAN PINK SALT", "IODIZED SALT",
      "SZECHUAN PEPPERCORNS"
    ];

    console.log(`Fixing ${toGram.length} ingredients from pcs to g...`);

    for (const name of toGram) {
      // 1. Update Ingredient
      await Ingredient.updateMany(
        { name: new RegExp(`^${name}$`, "i") },
        { $set: { defaultUnit: "g" } }
      );

      // 2. Update PantryItem
      await PantryItem.updateMany(
        { name: new RegExp(`^${name}$`, "i"), unit: "pcs" },
        { $set: { unit: "g" } }
      );

      // 3. Update Recipes
      const recipes = await Recipe.find({ "ingredients.name": new RegExp(`^${name}$`, "i") });
      for (const r of recipes) {
        let changed = false;
        r.ingredients.forEach(ing => {
          if (new RegExp(`^${name}$`, "i").test(ing.name) && ing.unit === "pcs") {
            ing.unit = "g";
            changed = true;
          }
        });
        if (changed) {
          r.markModified("ingredients");
          await r.save();
        }
      }
    }

    console.log("Patch applied successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

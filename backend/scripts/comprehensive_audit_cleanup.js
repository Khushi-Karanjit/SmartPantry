
/**
 * backend/scripts/comprehensive_audit_cleanup.js
 * Systematic cleanup of all ingredients in 'Other' category or with incorrect units.
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const Ingredient = require("../src/models/Ingredient");
    const PantryItem = require("../src/models/PantryItem");
    const Recipe = require("../src/models/Recipe");
    const { normalizeToSi } = require("../src/services/unit.service");

    const rules = [
      // 1. Oils (ml)
      { matches: ["OIL", "SUNFLOWER", "OLIVE OIL", "COCONUT OIL", "VEGETABLE OIL", "SESAME OIL", "MUSTARD OIL"], cat: "Oils", unit: "ml" },
      
      // 2. Dairy (ml or g)
      { matches: ["MILK", "YOGURT", "CREAM", "SOUR CREAM", "BUTTERMILK", "CONDENSED MILK"], cat: "Dairy", unit: "ml" },
      { matches: ["CHEESE", "PANEER", "MOZZARELLA", "PARMESAN", "CHEDDAR", "BUTTER", "GHEE"], cat: "Dairy", unit: "g" },
      
      // 3. Grains & Legumes (g)
      { matches: ["RICE", "BASMATI", "DAL", "LENTIL", "BEANS", "CHICKPEAS", "NOODLES", "PASTA", "SPAGHETTI", "MACARONI", "OATS", "QUINOA"], cat: "Grains", unit: "g" },
      { matches: ["MOONG DAL", "MASOOR DAL", "CHANA DAL", "FLOUR", "ATTA", "MAIDA"], cat: "Grains", unit: "g" },

      // 4. Condiments & Sauces (ml or g)
      { matches: ["VINEGAR", "SOY SAUCE", "KETCHUP", "MAYONNAISE", "MAPLE SYRUP", "HONEY", "VANILLA", "WORCESTERSHIRE"], cat: "Condiments", unit: "ml" },
      { matches: ["JAM", "JELLY", "PEANUT BUTTER", "MISO", "GOCHUJANG", "PASTE"], cat: "Condiments", unit: "g" },

      // 5. Baking (g)
      { matches: ["SUGAR", "GELATIN", "CAKE MIX", "PROTEIN POWDER", "BAKING POWDER", "BAKING SODA", "COCOA POWDER"], cat: "Baking", unit: "g" },

      // 6. Snacks & Nuts (g)
      { matches: ["PINE NUTS", "ALMONDS", "CASHEWS", "WALNUTS", "PEANUTS", "COCOA NIBS", "CHIPS"], cat: "Snacks", unit: "g" },

      // 7. Vegetables (g or pcs)
      { matches: ["ZUCCHINI", "YELLOW PEPPER", "GINGER", "GARLIC", "SPINACH", "KALE", "MUSHROOMS", "BOK CHOY"], cat: "Vegetables", unit: "g" },
      { matches: ["ONION", "POTATO", "TOMATO", "EGGPLANT", "LEMON", "LIME"], cat: "Vegetables", unit: "pcs" },
    ];

    console.log("Applying systematic mapping...");

    for (const rule of rules) {
      for (const keyword of rule.matches) {
        const query = { name: new RegExp(keyword, "i") };
        
        // Update Ingredient
        await Ingredient.updateMany(query, { $set: { category: rule.cat, defaultUnit: rule.unit } });

        // Update PantryItem
        // Only update unit if it was 'pcs' or if we are certain about the change
        await PantryItem.updateMany(
            { ...query, unit: { $nin: ['g', 'ml', 'kg', 'l'] } }, 
            { $set: { unit: rule.unit } }
        );

        // Update Recipes
        const recipes = await Recipe.find({ "ingredients.name": new RegExp(keyword, "i") });
        for (const r of recipes) {
          let rChanged = false;
          for (const ing of r.ingredients) {
            // Standardize ALL ingredients in the recipe to satisfy validation enums
            const si = normalizeToSi(ing.quantity, ing.unit, "Other"); // Use 'Other' as safe fallback
            if (ing.unit !== si.unit || ing.quantity !== si.quantity) {
              ing.unit = si.unit;
              ing.quantity = si.quantity;
              rChanged = true;
            }
          }
          if (rChanged) {
            r.markModified("ingredients");
            await r.save();
          }
        }
      }
    }

    console.log("Systematic cleanup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exit(1);
  }
}

run();


/**
 * backend/scripts/standardize_database.js
 * Migration script to enforce SI units and fix categories/expiry.
 */

const mongoose = require("mongoose");
require("dotenv").config();
const { normalizeToSi } = require("../src/services/unit.service");

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const Ingredient = require("../src/models/Ingredient");
    const PantryItem = require("../src/models/PantryItem");
    const Recipe = require("../src/models/Recipe");
    const Category = require("../src/models/Category");

    // 1. Repair Expiry Defaults (0 -> null)
    console.log("Repairing ingredients with 0 shelfLifeDays...");
    const expiryRepair = await Ingredient.updateMany(
      { shelfLifeDays: 0 },
      { $unset: { shelfLifeDays: "" } }
    );
    console.log(`Updated ${expiryRepair.modifiedCount} ingredients.`);

    // 2. Fix Categories for common items in 'Other'
    console.log("Fixing categories for specific items...");
    const catFixes = [
      { name: "YELLOW MOONG DAL", cat: "Grains" },
      { name: "YOGURT", cat: "Dairy" },
      { name: "ZUCCHINI", cat: "Vegetables" },
      { name: "YELLOW PEPPER", cat: "Vegetables" },
      { name: "BACON", cat: "Meat" },
      { name: "EGG", cat: "Dairy" }
    ];

    for (const fix of catFixes) {
      await Ingredient.updateMany(
        { name: new RegExp(`^${fix.name}$`, "i") },
        { $set: { category: fix.cat } }
      );
    }
    console.log("Category fixes applied.");

    // 3. Define Migration Unit Rules (Special for packets/jars)
    const fixUnit = (qty, unit, category) => {
      let u = (unit || "").toLowerCase();
      let q = Number(qty) || 0;

      // Handle the "packet/jar" request specifically
      if (['packet', 'pack', 'pkg'].includes(u)) {
        return { quantity: q * 500, unit: 'g' };
      }
      if (['jar', 'bottle', 'can'].includes(u)) {
        const isLiquid = ['Condiments', 'Oils', 'Dairy'].includes(category);
        return { quantity: isLiquid ? q * 300 : q * 400, unit: isLiquid ? 'ml' : 'g' };
      }

      // Use standard SI normalization for the rest
      return normalizeToSi(q, u, category);
    };

    // 4. Standardize Ingredients
    console.log("Standardizing Ingredients...");
    const ings = await Ingredient.find();
    for (const ing of ings) {
      const { quantity, unit } = fixUnit(1, ing.defaultUnit, ing.category);
      ing.defaultUnit = unit;
      ing.name = ing.name.toUpperCase();
      await ing.save();
    }

    // 5. Standardize Pantry Items
    console.log("Standardizing PantryItems...");
    const items = await PantryItem.find().populate("ingredientId");
    for (const it of items) {
      const cat = it.ingredientId ? it.ingredientId.category : "Other";
      const { quantity, unit } = fixUnit(it.quantity, it.unit, cat);
      it.quantity = quantity;
      it.unit = unit;
      await it.save();
    }

    // 6. Standardize Recipes
    console.log("Standardizing Recipes...");
    const recipes = await Recipe.find().populate("ingredients.ingredientId");
    for (const recipe of recipes) {
      let changed = false;
      for (const ing of recipe.ingredients) {
        const cat = ing.ingredientId ? ing.ingredientId.category : "Other";
        const { quantity, unit } = fixUnit(ing.quantity, ing.unit, cat);
        if (ing.unit !== unit || ing.quantity !== quantity) {
          ing.quantity = quantity;
          ing.unit = unit;
          changed = true;
        }
      }
      if (changed) {
        // Trigger pre-save hook for macro recalculation
        recipe.markModified('ingredients');
        await recipe.save();
      }
    }

    console.log("Database Standardization Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();

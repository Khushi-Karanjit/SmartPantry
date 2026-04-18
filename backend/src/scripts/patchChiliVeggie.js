require("dotenv").config();
const mongoose = require("mongoose");
const Ingredient = require("../models/Ingredient");
const PantryItem = require("../models/PantryItem");
const Recipe = require("../models/Recipe");

async function patch() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const fixes = [
    { from: "DRIED CHILY", to: "DRIED CHILI" },
    { from: "MIXED VEGGY", to: "MIXED VEGGIE" },
    { from: "WHOLE DRY CHILY", to: "WHOLE DRY CHILI" },
  ];
  for (const { from, to } of fixes) {
    const ing = await Ingredient.findOne({ name: from });
    if (!ing) { console.log("Not found:", from); continue; }
    await Ingredient.updateOne({ _id: ing._id }, { $set: { name: to } });
    await PantryItem.updateMany({ ingredientId: ing._id }, { $set: { name: to } });
    const recipes = await Recipe.find({ "ingredients.ingredientId": ing._id });
    for (const r of recipes) {
      r.ingredients = r.ingredients.map(i =>
        i.ingredientId?.toString() === ing._id.toString() ? { ...i, name: to } : i
      );
      await r.save();
    }
    console.log("Fixed:", from, "->", to);
  }
  await mongoose.disconnect();
  console.log("Done!");
}
patch().catch(console.error);

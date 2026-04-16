const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");
const PantryItem = require("../src/models/PantryItem");

const MONGO_URI = "mongodb+srv://KK:happy07@professionals.qlmr3d5.mongodb.net/?retryWrites=true&w=majority&appName=Professionals";

async function globalConsolidate() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to database...");

  const allIngredients = await Ingredient.find().lean();
  console.log(`Analyzing ${allIngredients.length} ingredients...`);

  const groups = new Map();
  allIngredients.forEach(ing => {
    const key = ing.name.toLowerCase().trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(ing);
  });

  let remappedCount = 0;
  let deletedCount = 0;

  for (const [name, list] of groups.entries()) {
    if (list.length <= 1) continue;

    console.log(`Processing duplicates for "${name}" (${list.length} entries)...`);

    // Sort to find canonical: Official (isCustom=false) first, then alphabetical category
    list.sort((a, b) => {
      if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
      return (a.category || "").localeCompare(b.category || "");
    });

    const canonical = list[0];
    const duplicates = list.slice(1);
    const dupeIds = duplicates.map(d => d._id.toString());

    // 1. Remap Recipes
    const recipesToUpdate = await Recipe.find({ "ingredients.ingredientId": { $in: dupeIds } });
    for (const r of recipesToUpdate) {
      let modified = false;
      r.ingredients.forEach(ing => {
        if (dupeIds.includes(ing.ingredientId)) {
          ing.ingredientId = canonical._id.toString();
          modified = true;
        }
      });
      if (modified) {
        await r.save();
        remappedCount++;
      }
    }

    // 2. Remap PantryItems
    const pantryUpdate = await PantryItem.updateMany(
      { ingredientId: { $in: dupeIds } },
      { $set: { ingredientId: canonical._id.toString() } }
    );
    remappedCount += (pantryUpdate.modifiedCount || pantryUpdate.nModified || 0);

    // 3. Delete duplicates
    const deleteRes = await Ingredient.deleteMany({ _id: { $in: dupeIds } });
    deletedCount += deleteRes.deletedCount;
  }

  console.log(`Global Consolidation Finished.`);
  console.log(`- Remapped ${remappedCount} references in total.`);
  console.log(`- Deleted ${deletedCount} duplicate ingredient records.`);
  process.exit(0);
}

globalConsolidate().catch(err => {
  console.error(err);
  process.exit(1);
});

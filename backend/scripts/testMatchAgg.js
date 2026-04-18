// backend/scripts/testMatchAgg.js
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");
const PantryItem = require("../src/models/PantryItem");

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smartpantry');
  const pantry = await PantryItem.find().select("ingredientId").lean();
  const pantryStringIds = pantry.filter(p => !!p.ingredientId).map(p => String(p.ingredientId));
  const pantryObjectIds = pantry.filter(p => !!p.ingredientId).map(p => new mongoose.Types.ObjectId(p.ingredientId));
  
  console.log("Found pantry strict string IDs:", pantryStringIds.length);
  console.log("Found pantry strict Object IDs:", pantryObjectIds.length);

  // Test 1: Both ObjectIds
  const pipeline1 = [
      { $limit: 1 },
      {
        $addFields: {
          matchedCount: {
            $size: {
              $setIntersection: [
                {
                  $map: {
                    input: { $ifNull: ["$ingredients", []] },
                    as: "ing",
                    in: "$$ing.ingredientId" // Raw ObjectId
                  }
                },
                pantryObjectIds // Raw array of ObjectIds!
              ]
            }
          },
          totalIngredients: { $size: { $ifNull: ["$ingredients", []] } }
        }
      }
  ];

  // Test 2: Both Strings
  const pipeline2 = [
      { $limit: 1 },
      {
        $addFields: {
          matchedCount: {
            $size: {
              $setIntersection: [
                {
                  $map: {
                    input: { $ifNull: ["$ingredients", []] },
                    as: "ing",
                    in: { $toString: "$$ing.ingredientId" }
                  }
                },
                pantryStringIds
              ]
            }
          },
          totalIngredients: { $size: { $ifNull: ["$ingredients", []] } }
        }
      }
  ];

  const res1 = await Recipe.aggregate(pipeline1);
  const res2 = await Recipe.aggregate(pipeline2);

  console.log("Test 1 (ObjectIds):", { matched: res1[0]?.matchedCount, total: res1[0]?.totalIngredients });
  console.log("Test 2 (Strings):", { matched: res2[0]?.matchedCount, total: res2[0]?.totalIngredients });

  // Let's also test suggestRecipes logic
  const selectedIds = pantryStringIds;
  const recipe = await Recipe.findOne().lean();
  const recipeIngredientIds = recipe.ingredients.map(ing => String(ing.ingredientId));
  const matchedIngredients = selectedIds.filter(id => recipeIngredientIds.includes(String(id)));
  
  console.log("Test 3 (suggestRecipes manual string matching):");
  console.log("Recipe:", recipe.name);
  console.log("Recipe DB Ids:", recipeIngredientIds);
  // console.log("Selected Ids:", selectedIds);
  console.log("Matched IDs manually:", matchedIngredients);
  
  process.exit();
}
run();

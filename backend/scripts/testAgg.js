// backend/scripts/testAgg.js
const mongoose = require("mongoose");
const Recipe = require("../src/models/Recipe");
const PantryItem = require("../models/PantryItem");

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/smartpantry');
  // Mock req.userId -> just grab any pantry
  const firstPantryUser = await PantryItem.findOne();
  if(!firstPantryUser) return console.log("No pantry items!");
  const userId = firstPantryUser.userId;
  
  const pantry = await PantryItem.find({ userId }).select("ingredientId").lean();
  const pantryIngredientIds = pantry.filter(p => !!p.ingredientId).map(p => String(p.ingredientId));
  
  console.log("Pantry Ids:", pantryIngredientIds);
  
  const pipeline = [
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
                pantryIngredientIds
              ]
            }
          },
          totalIngredients: { $size: { $ifNull: ["$ingredients", []] } }
        }
      },
      {
        $addFields: {
           matchPercentage: {
            $cond: {
              if: { $gt: ["$totalIngredients", 0] },
              then: { $round: [ { $multiply: [ { $divide: ["$matchedCount", "$totalIngredients"] }, 100 ] }, 0 ] },
              else: 0
            }
          }
        }
      },
      { $limit: 2 }
  ];
  
  const recipes = await Recipe.aggregate(pipeline);
  console.log(JSON.stringify(recipes.map(r => ({ name: r.name, matched: r.matchedCount, matchPercentage: r.matchPercentage })), null, 2));
  process.exit();
}
run();

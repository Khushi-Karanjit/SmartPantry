
/**
 * backend/scripts/repair_recipe_photos.js
 * Scans DB and replaces missing or generic recipe image URLs with curated high-def Unsplash images based on title.
 */

const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Recipe = require("../src/models/Recipe");
    
    const imageMappings = [
      { text: "pizza", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200" },
      { text: "taco", url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200" },
      { text: "chicken", url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200" },
      { text: "fish", url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200" },
      { text: "salmon", url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200" },
      { text: "curry", url: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1200" },
      { text: "spaghetti", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200" },
      { text: "pasta", url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=1200" },
      { text: "avocado", url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200" },
      { text: "stir-fry", url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200" },
      { text: "pork", url: "https://images.unsplash.com/photo-1544025162-8315ea07fc7a?w=1200" },
      { text: "beef", url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200" }
    ];

    const premiumDefaults = [
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
      "https://images.unsplash.com/photo-1482049118208-0bf229bfc1ce?w=1200"
    ];

    const recipes = await Recipe.find({});
    let updatedCount = 0;
    
    for (const r of recipes) {
      let matchedUrl = null;
      
      // Keyword Match
      for (const map of imageMappings) {
        if (r.name.toLowerCase().includes(map.text)) {
          matchedUrl = map.url;
          break;
        }
      }

      // If missing/broken or we want to force higher quality map
      const isMissing = !r.imageUrl || r.imageUrl.trim() === "";
      
      if (isMissing || matchedUrl) {
        const newUrl = matchedUrl || premiumDefaults[updatedCount % premiumDefaults.length];
        // Enforce the new HD urls
        if (r.imageUrl !== newUrl) {
          console.log(`Updating ${r.name.padEnd(30)} from [Old] to [${newUrl.substring(0,40)}...]`);
          await Recipe.updateOne({ _id: r._id }, { $set: { imageUrl: newUrl } });
          updatedCount++;
        }
      }
    }

    console.log(`\nSuccessfully repaired ${updatedCount} recipe photos!`);
    process.exit(0);
  } catch (err) {
    console.error("Photo repair failed:", err);
    process.exit(1);
  }
}

run();

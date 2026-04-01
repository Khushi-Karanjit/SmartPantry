const mongoose = require("mongoose");
require("dotenv").config();
const Ingredient = require("./src/models/Ingredient");

const shelfLifeMap = {
  // By Category Defaults
  categories: {
    "Dairy": 10,
    "Meat": 5,
    "Vegetables": 7,
    "Fruits": 7,
    "Bakery": 5,
    "Grains": 180,
    "Spices": 365,
    "Oils": 365,
    "Condiments": 90,
    "Canned": 730,
    "Other": 30
  },
  // Specific Overrides
  specifics: {
    "eggs": 30,
    "milk": 7,
    "butter": 60,
    "salt": 1000,
    "sugar": 1000,
    "rice": 365,
    "flour": 365,
    "pasta": 365,
    "olive oil": 365,
    "honey": 1000,
    "garlic": 60,
    "onion": 30,
    "potatoes": 30
  }
};

async function fixShelfLife() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for data fix...");

    const ingredients = await Ingredient.find();
    let updatedCount = 0;

    for (const ing of ingredients) {
      const name = ing.name.toLowerCase();
      const category = ing.category;
      
      let newDays = shelfLifeMap.categories[category] || 30; // Default to 30

      // Override with specific name if found
      if (shelfLifeMap.specifics[name]) {
        newDays = shelfLifeMap.specifics[name];
      }

      if (ing.shelfLifeDays !== newDays) {
        ing.shelfLifeDays = newDays;
        await ing.save();
        updatedCount++;
        console.log(`Updated: ${ing.name} -> ${newDays} days`);
      }
    }

    console.log(`\nSuccess! Updated ${updatedCount} ingredients.`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating ingredients:", err);
    process.exit(1);
  }
}

fixShelfLife();

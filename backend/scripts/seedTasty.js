// backend/scripts/seedTasty.js
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const tastyRecipes = [
  {
    name: "Golden Garlic Butter Chicken",
    description: "The most popular Tasty recipe ever. Crispy chicken in a rich garlic butter sauce.",
    cuisine: "American",
    diet: "High Protein",
    prepMinutes: 25,
    calories: 520,
    servings: 2,
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    videoUrl: "https://www.youtube.com/watch?v=0UKezbOZIGE",
    ingredients: [
      { name: "Chicken Breast", quantity: 500, unit: "grams" },
      { name: "Garlic", quantity: 6, unit: "cloves" },
      { name: "Butter", quantity: 50, unit: "grams" },
      { name: "Olive Oil", quantity: 1, unit: "tbsp" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Season the chicken breast with salt and pepper.", startTime: 2 },
      { text: "Heat olive oil in a pan and sear chicken until golden.", startTime: 25 },
      { text: "Add butter and minced garlic to the pan.", startTime: 85 },
      { text: "Baste the chicken with garlic butter until fully cooked.", startTime: 120 }
    ],
    status: "published"
  },
  {
    name: "One-Pot Tomato Pasta",
    description: "Maximum flavor, minimum dishes. Everything cooks together in one pot.",
    cuisine: "Italian",
    diet: "Vegetarian",
    prepMinutes: 15,
    calories: 450,
    servings: 4,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    videoUrl: "https://www.youtube.com/watch?v=bJUiWdM__Qw",
    ingredients: [
      { name: "Pasta", quantity: 500, unit: "grams" },
      { name: "Onion", quantity: 1, unit: "pcs" },
      { name: "Garlic", quantity: 3, unit: "cloves" },
      { name: "Tomato Sauce", quantity: 400, unit: "ml" },
      { name: "Basil", quantity: 10, unit: "grams" }
    ],
    steps: [
      { text: "Thinly slice the onions and garlic.", startTime: 5 },
      { text: "Add pasta, onion, garlic, and tomato sauce to a large pot.", startTime: 30 },
      { text: "Cover with water and bring to a boil.", startTime: 60 },
      { text: "Simmer until pasta is al dente and sauce is thick.", startTime: 150 },
      { text: "Finish with fresh basil and parmesan.", startTime: 210 }
    ],
    status: "published"
  },
  {
    name: "Tasty Club Sandwich",
    description: "The ultimate lunch stack with crispy bacon and fresh greens.",
    cuisine: "American",
    diet: "High Protein",
    prepMinutes: 10,
    calories: 680,
    servings: 1,
    imageUrl: "https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=800",
    videoUrl: "https://www.youtube.com/watch?v=5XEOEfUCNpg",
    ingredients: [
      { name: "Bread", quantity: 3, unit: "slices" },
      { name: "Eggs", quantity: 1, unit: "pcs" },
      { name: "Salt", quantity: 1, unit: "tsp" }
    ],
    steps: [
      { text: "Toast the bread slices until golden brown.", startTime: 10 },
      { text: "Fry the bacon until perfectly crispy.", startTime: 40 },
      { text: "Layer the turkey, bacon, lettuce, and tomato.", startTime: 90 },
      { text: "Secure with toothpicks and slice diagonally.", startTime: 140 }
    ],
    status: "published"
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartpantry");
    console.log("Connected to MongoDB for Tasty Seeding...");

    // Get all ingredients to map IDs
    const allIngs = await Ingredient.find({});
    const ingMap = new Map(allIngs.map(i => [i.name.toLowerCase(), i._id]));

    const finalRecipes = [];

    for (const recipeData of tastyRecipes) {
      const ingredientList = [];
      
      for (const ing of recipeData.ingredients) {
        let ingId = ingMap.get(ing.name.toLowerCase());
        
        if (!ingId) {
          // Semi-random category if missing
          const newIng = await Ingredient.create({
            name: ing.name.toLowerCase(),
            category: "Other",
            defaultUnit: ing.unit || "pcs"
          });
          ingId = newIng._id;
          ingMap.set(ing.name.toLowerCase(), ingId);
        }

        ingredientList.push({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          ingredientId: ingId
        });
      }

      finalRecipes.push({
        ...recipeData,
        ingredients: ingredientList
      });
    }

    console.log(`Seeding ${finalRecipes.length} Tasty recipes...`);
    await Recipe.insertMany(finalRecipes);

    console.log("Tasty seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

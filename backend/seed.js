// backend/seed.js
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("./src/models/Category");
const PantryPreset = require("./src/models/PantryPreset");
const Ingredient = require("./src/models/Ingredient");
const Recipe = require("./src/models/Recipe");

const categories = [
  { name: "Vegetables", shelfLifeDays: 7 },
  { name: "Grains", shelfLifeDays: 180 },
  { name: "Dairy", shelfLifeDays: 10 },
  { name: "Spices", shelfLifeDays: 365 },
  { name: "Fruits", shelfLifeDays: 5 },
  { name: "Meat", shelfLifeDays: 3 },
  { name: "Seafood", shelfLifeDays: 2 },
  { name: "Oils", shelfLifeDays: 180 },
  { name: "Snacks", shelfLifeDays: 30 },
  { name: "Canned Goods", shelfLifeDays: 365 },
  { name: "Bakery", shelfLifeDays: 5 },
  { name: "Condiments", shelfLifeDays: 90 },
  { name: "Frozen", shelfLifeDays: 180 },
  { name: "Other", shelfLifeDays: 30 },
];

const presets = [
  {
    key: "essential",
    title: "Kitchen Essentials",
    description: "Everyday basics every kitchen needs.",
    items: [
      { name: "Eggs", category: "Dairy", quantity: 12, unit: "pcs" },
      { name: "Milk", category: "Dairy", quantity: 1, unit: "liter" },
      { name: "Butter", category: "Dairy", quantity: 200, unit: "grams" },
      { name: "Bread", category: "Bakery", quantity: 1, unit: "loaf" },
      { name: "Salt", category: "Spices", quantity: 500, unit: "grams" },
      { name: "Pepper", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Olive Oil", category: "Oils", quantity: 500, unit: "ml" },
      { name: "Garlic", category: "Vegetables", quantity: 200, unit: "grams" },
      { name: "Onion", category: "Vegetables", quantity: 1, unit: "kg" },
      { name: "Flour", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Sugar", category: "Other", quantity: 500, unit: "grams" },
    ],
  },
  {
    key: "asian",
    title: "Asian Pantry",
    description: "Ingredients for stir-fries, curries, and more.",
    items: [
      { name: "Rice", category: "Grains", quantity: 5, unit: "kg" },
      { name: "Soy Sauce", category: "Condiments", quantity: 250, unit: "ml" },
      { name: "Ginger", category: "Vegetables", quantity: 100, unit: "grams" },
      { name: "Lentils", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Turmeric", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Cumin", category: "Spices", quantity: 50, unit: "grams" },
      { name: "Chicken Breast", category: "Meat", quantity: 500, unit: "grams" },
      { name: "Mustard Oil", category: "Oils", quantity: 1, unit: "liter" },
    ],
  },
  {
    key: "mediterranean",
    title: "Mediterranean",
    description: "Healthy fats, fresh greens, and pasta.",
    items: [
      { name: "Pasta", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Tomato Sauce", category: "Canned Goods", quantity: 1, unit: "jar" },
      { name: "Canned Tuna", category: "Seafood", quantity: 3, unit: "cans" },
      { name: "Lemon", category: "Fruits", quantity: 5, unit: "pcs" },
      { name: "Basil", category: "Vegetables", quantity: 30, unit: "grams" },
      { name: "Parmesan", category: "Dairy", quantity: 150, unit: "grams" },
      { name: "Avocado", category: "Fruits", quantity: 2, unit: "pcs" },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Seed Categories
    console.log("Seeding categories...");
    await Category.deleteMany({});
    await Category.insertMany(categories);

    // 2. Seed Presets
    console.log("Seeding presets...");
    await PantryPreset.deleteMany({});
    await PantryPreset.insertMany(presets);

    // 3. Seed Ingredients based on Presets
    console.log("Seeding ingredients...");
    await Ingredient.deleteMany({});
    const ingredientDocs = [];
    const seenNames = new Set();
    for (const preset of presets) {
      for (const item of preset.items) {
        const lowerName = item.name.toLowerCase();
        if (!seenNames.has(lowerName)) {
          ingredientDocs.push({
            name: lowerName,
            category: item.category,
            defaultUnit: item.unit,
          });
          seenNames.add(lowerName);
        }
      }
    }
    const insertedIngredients = await Ingredient.insertMany(ingredientDocs);
    const ingMap = new Map(insertedIngredients.map(i => [i.name.toLowerCase(), i._id]));

    // 4. Seed Recipes
    console.log("Seeding recipes...");
    await Recipe.deleteMany({});
    const recipes = [
      {
        name: "Classic Nepali Dal Bhat",
        description: "The staple meal of Nepal - nutritious lentil soup with rice.",
        cuisine: "Nepali",
        diet: "Vegan",
        prepMinutes: 40,
        calories: 600,
        servings: 2,
        imageUrl: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?q=80&w=300",
        ingredients: [
          { name: "Rice", quantity: 500, unit: "grams", ingredientId: ingMap.get("rice") },
          { name: "Lentils", quantity: 200, unit: "grams", ingredientId: ingMap.get("lentils") },
          { name: "Turmeric", quantity: 1, unit: "tsp", ingredientId: ingMap.get("turmeric") },
          { name: "Mustard Oil", quantity: 2, unit: "tbsp", ingredientId: ingMap.get("mustard oil") },
        ],
        steps: ["Cook rice.", "Boil lentils with turmeric until soft.", "Heat oil and fry garlic.", "Combine and serve."],
        status: "published"
      },
      {
        name: "Avocado Toast with Egg",
        description: "A trendy, healthy, and easy breakfast.",
        cuisine: "Universal",
        diet: "Vegetarian",
        prepMinutes: 10,
        calories: 350,
        servings: 1,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300",
        ingredients: [
          { name: "Bread", quantity: 2, unit: "slices", ingredientId: ingMap.get("bread") },
          { name: "Avocado", quantity: 1, unit: "pcs", ingredientId: ingMap.get("avocado") },
          { name: "Eggs", quantity: 1, unit: "pcs", ingredientId: ingMap.get("eggs") },
          { name: "Butter", quantity: 5, unit: "grams", ingredientId: ingMap.get("butter") },
        ],
        steps: ["Toast the bread.", "Mash avocado with salt and pepper.", "Fry egg in butter.", "Assemble."],
        status: "published"
      },
      {
        name: "Quick Spaghetti Pomodoro",
        description: "Classic Italian pasta with a rich tomato sauce.",
        cuisine: "Italian",
        diet: "Vegetarian",
        prepMinutes: 20,
        calories: 450,
        servings: 2,
        imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=300",
        ingredients: [
          { name: "Pasta", quantity: 250, unit: "grams", ingredientId: ingMap.get("pasta") },
          { name: "Tomato Sauce", quantity: 400, unit: "ml", ingredientId: ingMap.get("tomato sauce") },
          { name: "Olive Oil", quantity: 2, unit: "tbsp", ingredientId: ingMap.get("olive oil") },
          { name: "Basil", quantity: 10, unit: "grams", ingredientId: ingMap.get("basil") },
          { name: "Parmesan", quantity: 50, unit: "grams", ingredientId: ingMap.get("parmesan") },
        ],
        steps: ["Boil pasta until al dente.", "Simmer tomato sauce with oil and basil.", "Toss pasta with sauce.", "Top with cheese."],
        status: "published"
      },
      {
        name: "Simple Chicken Stir-fry",
        description: "Fast and healthy chicken with soy sauce and ginger.",
        cuisine: "Asian",
        diet: "High Protein",
        prepMinutes: 15,
        calories: 380,
        servings: 2,
        imageUrl: "https://images.unsplash.com/photo-1603133872878-085e12da636c?q=80&w=300",
        ingredients: [
          { name: "Chicken Breast", quantity: 400, unit: "grams", ingredientId: ingMap.get("chicken breast") },
          { name: "Soy Sauce", quantity: 3, unit: "tbsp", ingredientId: ingMap.get("soy sauce") },
          { name: "Ginger", quantity: 10, unit: "grams", ingredientId: ingMap.get("ginger") },
          { name: "Garlic", quantity: 15, unit: "grams", ingredientId: ingMap.get("garlic") },
          { name: "Onion", quantity: 100, unit: "grams", ingredientId: ingMap.get("onion") },
        ],
        steps: ["Dice chicken and onion.", "Sauté ginger and garlic.", "Add chicken and cook through.", "Deglaze with soy sauce."],
        status: "published"
      },
      {
        name: "Tuna Salad with Lemon",
        description: "A fresh and high-protein salad in minutes.",
        cuisine: "Mediterranean",
        diet: "Keto",
        prepMinutes: 5,
        calories: 220,
        servings: 1,
        imageUrl: "https://images.unsplash.com/photo-1546039907-7fa05f864c02?q=80&w=300",
        ingredients: [
          { name: "Canned Tuna", quantity: 1, unit: "can", ingredientId: ingMap.get("canned tuna") },
          { name: "Lemon", quantity: 0.5, unit: "pcs", ingredientId: ingMap.get("lemon") },
          { name: "Olive Oil", quantity: 1, unit: "tbsp", ingredientId: ingMap.get("olive oil") },
          { name: "Onion", quantity: 30, unit: "grams", ingredientId: ingMap.get("onion") },
        ],
        steps: ["Drain tuna.", "Mix with chopped onion, olive oil, and lemon juice.", "Season with salt and pepper."],
        status: "published"
      },
      {
        name: "Butter Garlic Eggs",
        description: "Elevate your morning eggs with fragrant garlic.",
        cuisine: "Universal",
        diet: "Vegetarian",
        prepMinutes: 8,
        calories: 180,
        servings: 1,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300",
        ingredients: [
          { name: "Eggs", quantity: 2, unit: "pcs", ingredientId: ingMap.get("eggs") },
          { name: "Garlic", quantity: 10, unit: "grams", ingredientId: ingMap.get("garlic") },
          { name: "Butter", quantity: 15, unit: "grams", ingredientId: ingMap.get("butter") },
        ],
        steps: ["Melt butter over medium heat.", "Sauté garlic until golden.", "Fry eggs in the garlic butter."],
        status: "published"
      },
      {
        name: "Rice Pudding (Simple)",
        description: "A comforting sweet treat from pantry basics.",
        cuisine: "Universal",
        diet: "Vegetarian",
        prepMinutes: 30,
        calories: 320,
        servings: 2,
        imageUrl: "https://images.unsplash.com/photo-1603133872878-085e12da636c?q=80&w=300",
        ingredients: [
          { name: "Rice", quantity: 100, unit: "grams", ingredientId: ingMap.get("rice") },
          { name: "Milk", quantity: 500, unit: "ml", ingredientId: ingMap.get("milk") },
          { name: "Sugar", quantity: 3, unit: "tbsp", ingredientId: ingMap.get("sugar") },
          { name: "Butter", quantity: 10, unit: "grams", ingredientId: ingMap.get("butter") },
        ],
        steps: ["Simmer rice in milk until tender.", "Add sugar and butter.", "Cook until creamy.", "Serve warm."],
        status: "published"
      }
    ];
    await Recipe.insertMany(recipes);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();

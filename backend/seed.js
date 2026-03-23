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
  { name: "Oils", shelfLifeDays: 180 },
  { name: "Snacks", shelfLifeDays: 30 },
  { name: "Canned Goods", shelfLifeDays: 365 },
  { name: "Other", shelfLifeDays: 30 },
];

const presets = [
  {
    key: "student",
    title: "Student Essentials",
    description: "Budget-friendly basics for quick meals.",
    items: [
      { name: "Bread", category: "Grains", quantity: 1, unit: "loaf" },
      { name: "Eggs", category: "Dairy", quantity: 12, unit: "pcs" },
      { name: "Milk", category: "Dairy", quantity: 1, unit: "liter" },
      { name: "Ramen", category: "Snacks", quantity: 5, unit: "packets" },
      { name: "Butter", category: "Dairy", quantity: 200, unit: "grams" },
    ],
  },
  {
    key: "nepali",
    title: "Nepali Kitchen",
    description: "Traditional ingredients for a classic Nepali home.",
    items: [
      { name: "Rice", category: "Grains", quantity: 5, unit: "kg" },
      { name: "Lentils", category: "Grains", quantity: 2, unit: "kg" },
      { name: "Turmeric", category: "Spices", quantity: 100, unit: "grams" },
      { name: "Cumin", category: "Spices", quantity: 100, unit: "grams" },
      { name: "Mustard Oil", category: "Oils", quantity: 1, unit: "liter" },
      { name: "Ginger", category: "Vegetables", quantity: 250, unit: "grams" },
      { name: "Garlic", category: "Vegetables", quantity: 250, unit: "grams" },
    ],
  },
  {
    key: "italian",
    title: "Italian Basics",
    description: "Essential ingredients for pasta and Mediterranean dishes.",
    items: [
      { name: "Pasta", category: "Grains", quantity: 1, unit: "kg" },
      { name: "Tomato Sauce", category: "Canned Goods", quantity: 2, unit: "jars" },
      { name: "Olive Oil", category: "Oils", quantity: 500, unit: "ml" },
      { name: "Basil", category: "Vegetables", quantity: 50, unit: "grams" },
      { name: "Parmesan", category: "Dairy", quantity: 200, unit: "grams" },
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
    for (const preset of presets) {
      for (const item of preset.items) {
        ingredientDocs.push({
          name: item.name.toLowerCase(),
          category: item.category,
          defaultUnit: item.unit,
        });
      }
    }
    const insertedIngredients = await Ingredient.insertMany(ingredientDocs);
    const ingMap = new Map(insertedIngredients.map(i => [i.name, i._id]));

    // 4. Seed Recipes
    console.log("Seeding recipes...");
    await Recipe.deleteMany({});
    const recipes = [
      {
        name: "Simple Fried Egg",
        description: "A quick and easy protein-packed meal.",
        cuisine: "Universal",
        diet: "Vegetarian",
        prepMinutes: 5,
        calories: 150,
        servings: 1,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300",
        ingredients: [
          { name: "Eggs", quantity: 2, unit: "pcs", ingredientId: ingMap.get("eggs") },
          { name: "Butter", quantity: 10, unit: "grams", ingredientId: ingMap.get("butter") },
        ],
        steps: ["Heat butter in a pan.", "Crack eggs into the pan.", "Fry until whites are set."],
        status: "published"
      },
      {
        name: "Nepali Dal Bhat",
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
        steps: ["Cook rice.", "Boil lentils with turmeric until soft.", "Heat oil and fry garlic (optional).", "Combine and serve."],
        status: "published"
      },
      {
        name: "Spaghetti Pomodoro",
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
          { name: "Olive Oil", quantity: 1, unit: "tbsp", ingredientId: ingMap.get("olive oil") },
          { name: "Basil", quantity: 5, unit: "leaves", ingredientId: ingMap.get("basil") },
        ],
        steps: ["Boil pasta until al dente.", "Simmer tomato sauce in oil.", "Toss pasta with sauce.", "Top with basil."],
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

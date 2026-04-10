// backend/scripts/dbSyncV2.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Ingredient = require("../src/models/Ingredient");
const Recipe = require("../src/models/Recipe");

const recipesToSync = [
  // ── Existing Indian & Fusion ──────────────────
  {
    name: "Homemade Butter Chicken (Murgh Makhani)",
    description: "Authentic, rich, and creamy Indian butter chicken with tender marinated thighs.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=AFdgqJkAzGc",
    imageUrl: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800",
    prepMinutes: 45, calories: 650, protein: 45, carbs: 15, fat: 40, servings: 4,
    ingredients: [
      { name: "chicken thighs", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 1, unit: "cup" },
      { name: "heavy cream", quantity: 0.5, unit: "cup" },
      { name: "butter", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Marinate chicken; sear; add tomato sauce and cream.", startTime: 30 }]
  },
  {
    name: "Red Lentil Dal (Tarka Dal)",
    description: "A nutritious and comforting vegan dal with a fragrant spiced oil tempering (Tarka).",
    cuisine: "Indian", diet: "Vegan", mealType: "lunch",
    videoUrl: "https://www.youtube.com/watch?v=NKTsXPLNsmo",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800",
    prepMinutes: 15, calories: 300, protein: 18, carbs: 45, fat: 5, servings: 4,
    ingredients: [{ name: "red lentils", quantity: 1, unit: "cup" }, { name: "turmeric", quantity: 1, unit: "tsp" }],
    steps: [{ text: "Boil lentils; add spiced tarka oil.", startTime: 20 }]
  },
  {
    name: "Chicken Tikka Masala",
    description: "Hearty and aromatic chicken tikka masala with a rich spiced tomato gravy.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=vV_pP60_vXY",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800",
    prepMinutes: 40, calories: 600, protein: 42, carbs: 18, fat: 35, servings: 4,
    ingredients: [{ name: "chicken breast", quantity: 1, unit: "lb" }, { name: "tikka masala spices", quantity: 2, unit: "tbsp" }],
    steps: [{ text: "Grill chicken; simmer in tomato cream sauce.", startTime: 40 }]
  },
  {
    name: "Vegetable Biryani",
    description: "Layered and fragrant basmati rice cooked with mixed vegetables and aromatic spices.",
    cuisine: "Indian", diet: "Vegetarian", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=1uN3BvYisCc",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=800",
    prepMinutes: 50, calories: 450, protein: 12, carbs: 75, fat: 10, servings: 4,
    ingredients: [{ name: "basmati rice", quantity: 2, unit: "cups" }, { name: "mixed vegetables", quantity: 2, unit: "cups" }],
    steps: [{ text: "Layer rice and spiced veggies; steam for 15 mins.", startTime: 60 }]
  },
  {
    name: "Slow Cooker Lamb Curry",
    description: "Tender, fall-off-the-bone lamb curry made easy in the slow cooker.",
    cuisine: "Indian Fusion", diet: "High Protein", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=8q2S4FfT17s",
    imageUrl: "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800",
    prepMinutes: 20, calories: 550, protein: 38, carbs: 12, fat: 35, servings: 6,
    ingredients: [{ name: "lamb shoulder", quantity: 2, unit: "lb" }, { name: "curry paste", quantity: 0.5, unit: "cup" }],
    steps: [{ text: "Slow cook lamb with paste and water for 8 hours.", startTime: 10 }]
  },
  {
    name: "Saag Paneer",
    description: "Rich spinach curry with cubes of fried paneer cheese.",
    cuisine: "Indian", diet: "Vegetarian", mealType: "lunch",
    videoUrl: "https://www.youtube.com/watch?v=2W-vEis0_8A",
    imageUrl: "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=800",
    prepMinutes: 30, calories: 400, protein: 20, carbs: 10, fat: 30, servings: 4,
    ingredients: [{ name: "spinach", quantity: 1, unit: "lb" }, { name: "paneer", quantity: 200, unit: "g" }],
    steps: [{ text: "Blanch spinach; blend; sauté with paneer and spices.", startTime: 30 }]
  },

  // ── 12 NEW REAL RECIPES ──────────────────
  {
    name: "Moong Dal Chilla (Savory Crepes)",
    description: "Nutritious and high-protein Indian breakfast crepes made from yellow lentils.",
    cuisine: "Indian", diet: "Vegan / High Protein", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800",
    prepMinutes: 15, calories: 220, protein: 12, carbs: 35, fat: 4, servings: 2,
    ingredients: [
      { name: "yellow moong dal", quantity: 1, unit: "cup" },
      { name: "spinach", quantity: 0.5, unit: "cup" },
      { name: "green chili", quantity: 1, unit: "pcs" },
      { name: "ginger", quantity: 1, unit: "inch" }
    ],
    steps: [{ text: "Grind soaked dal with ginger; spread on griddle; cook until crisp.", startTime: 20 }]
  },
  {
    name: "Egg Drop Soup with Greens",
    description: "Light and silky Chinese breakfast soup with protein-packed eggs and fresh spinach.",
    cuisine: "Chinese", diet: "Low Carb", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    prepMinutes: 10, calories: 150, protein: 10, carbs: 5, fat: 8, servings: 2,
    ingredients: [
      { name: "eggs", quantity: 2, unit: "pcs" },
      { name: "chicken broth", quantity: 2, unit: "cups" },
      { name: "spinach", quantity: 1, unit: "cup" },
      { name: "soy sauce", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Boil broth; swirl in beaten eggs; add spinach until wilted.", startTime: 15 }]
  },
  {
    name: "Spinach & Tomato Frittata",
    description: "Classic Italian baked egg dish with vibrant vegetables and light parmesan.",
    cuisine: "Italian", diet: "Vegetarian", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1510693222259-55581898c1af?w=800",
    prepMinutes: 10, calories: 240, protein: 18, carbs: 6, fat: 16, servings: 2,
    ingredients: [
      { name: "eggs", quantity: 4, unit: "pcs" },
      { name: "cherry tomatoes", quantity: 0.5, unit: "cup" },
      { name: "spinach", quantity: 1, unit: "cup" },
      { name: "parmesan", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Whisk eggs; sauté veggies; pour eggs and bake until set.", startTime: 25 }]
  },
  {
    name: "Healthy Huevos Rancheros",
    description: "A balanced Mexican breakfast with corn tortillas, black beans, and a sunny egg.",
    cuisine: "Mexican", diet: "High Fiber", mealType: "breakfast",
    imageUrl: "https://images.unsplash.com/photo-1593584785033-9c7604d0863f?w=800",
    prepMinutes: 15, calories: 350, protein: 15, carbs: 45, fat: 12, servings: 1,
    ingredients: [
      { name: "corn tortilla", quantity: 2, unit: "pcs" },
      { name: "eggs", quantity: 1, unit: "pcs" },
      { name: "black beans", quantity: 0.5, unit: "cup" },
      { name: "salsa", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Toast tortillas; top with warm beans, fried egg, and salsa.", startTime: 20 }]
  },
  {
    name: "Bhindi Masala (Spiced Okra)",
    description: "Flavorful and fiber-rich Indian okra stir-fry with onions and aromatic spices.",
    cuisine: "Indian", diet: "Vegan", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800",
    prepMinutes: 15, calories: 180, protein: 4, carbs: 20, fat: 10, servings: 2,
    ingredients: [
      { name: "okra", quantity: 1, unit: "lb" },
      { name: "onion", quantity: 1, unit: "pcs" },
      { name: "turmeric", quantity: 1, unit: "tsp" },
      { name: "cumin seeds", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Sauté cumin and onions; add okra and spices; cook until tender.", startTime: 25 }]
  },
  {
    name: "Tofu & Broccoli Stir-Fry",
    description: "Quick and healthy Chinese lunch with ginger-soy glazed tofu and crisp broccoli.",
    cuisine: "Chinese", diet: "Vegan", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    prepMinutes: 10, calories: 320, protein: 22, carbs: 15, fat: 18, servings: 2,
    ingredients: [
      { name: "tofu", quantity: 1, unit: "block" },
      { name: "broccoli", quantity: 2, unit: "cups" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" },
      { name: "ginger", quantity: 1, unit: "tbsp" }
    ],
    steps: [{ text: "Press tofu; sear in wok; add broccoli and ginger-soy sauce.", startTime: 20 }]
  },
  {
    name: "Whole Wheat Spaghetti Bolognese",
    description: "Healthy Italian lunch using whole grain pasta and a lean turkey bolognese sauce.",
    cuisine: "Italian", diet: "High Fiber", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800",
    prepMinutes: 10, calories: 480, protein: 32, carbs: 65, fat: 12, servings: 4,
    ingredients: [
      { name: "whole wheat spaghetti", quantity: 1, unit: "lb" },
      { name: "ground turkey", quantity: 1, unit: "lb" },
      { name: "tomato puree", quantity: 2, unit: "cups" },
      { name: "onions", quantity: 1, unit: "pcs" }
    ],
    steps: [{ text: "Cook pasta; brown turkey with onions; simmer in tomato sauce.", startTime: 40 }]
  },
  {
    name: "Turkey Taco Bowl",
    description: "Low-carb Mexican lunch bowl with seasoned turkey, black beans, and fresh avocado.",
    cuisine: "Mexican", diet: "Low Carb", mealType: "lunch",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    prepMinutes: 15, calories: 420, protein: 35, carbs: 20, fat: 22, servings: 2,
    ingredients: [
      { name: "ground turkey", quantity: 1, unit: "lb" },
      { name: "black beans", quantity: 1, unit: "cup" },
      { name: "avocado", quantity: 1, unit: "pcs" },
      { name: "pico de gallo", quantity: 0.5, unit: "cup" }
    ],
    steps: [{ text: "Brown turkey; assemble in bowls with beans, salsa, and avocado.", startTime: 20 }]
  },
  {
    name: "Tandoori Style Grilled Chicken",
    description: "Protein-rich Indian dinner with yogurt and spice marinated chicken breast.",
    cuisine: "Indian", diet: "High Protein", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800",
    prepMinutes: 40, calories: 350, protein: 48, carbs: 5, fat: 14, servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "yogurt", quantity: 1, unit: "cup" },
      { name: "lemon juice", quantity: 2, unit: "tbsp" },
      { name: "tandoori spices", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Marinate chicken; grill at high heat until charred and juicy.", startTime: 40 }]
  },
  {
    name: "Steamed Fish with Scallions",
    description: "Elegant and light Chinese dinner with fresh ginger and scallion soy sauce.",
    cuisine: "Chinese", diet: "Paleo", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800",
    prepMinutes: 10, calories: 280, protein: 35, carbs: 4, fat: 12, servings: 2,
    ingredients: [
      { name: "white fish fillet", quantity: 1, unit: "lb" },
      { name: "scallions", quantity: 3, unit: "pcs" },
      { name: "ginger", quantity: 1, unit: "tbsp" },
      { name: "soy sauce", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Steam fish with ginger; top with scallions and hot soy-oil drizzle.", startTime: 20 }]
  },
  {
    name: "Lemon Herb Grilled Chicken",
    description: "Classic Italian-style chicken with fresh herbs and zesty citrus marinade.",
    cuisine: "Italian", diet: "Gluten Free", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    prepMinutes: 15, calories: 320, protein: 42, carbs: 2, fat: 15, servings: 2,
    ingredients: [
      { name: "chicken breast", quantity: 1, unit: "lb" },
      { name: "olive oil", quantity: 2, unit: "tbsp" },
      { name: "lemon", quantity: 1, unit: "pcs" },
      { name: "rosemary", quantity: 1, unit: "tsp" }
    ],
    steps: [{ text: "Marinate chicken; grill over medium heat until golden.", startTime: 30 }]
  },
  {
    name: "Vegetarian Zucchini Boats",
    description: "Healthy Mexican dinner featuring zucchini stuffed with beans, corn, and light cheese.",
    cuisine: "Mexican", diet: "Vegetarian", mealType: "dinner",
    imageUrl: "https://images.unsplash.com/photo-1605106702734-2e999c011e40?w=800",
    prepMinutes: 15, calories: 240, protein: 12, carbs: 28, fat: 10, servings: 2,
    ingredients: [
      { name: "zucchini", quantity: 2, unit: "pcs" },
      { name: "black beans", quantity: 1, unit: "cup" },
      { name: "corn", quantity: 0.5, unit: "cup" },
      { name: "cheddar", quantity: 2, unit: "tbsp" }
    ],
    steps: [{ text: "Hollow zucchinis; stuff with bean-corn mix; bake with cheese.", startTime: 35 }]
  },

  // ── MORE STUDENT MEALS & STEWS ──────────────────
  {
    name: "Honey Garlic Chicken Stir-Fry",
    cuisine: "Chinese Fusion", diet: "Quick & Easy", mealType: "lunch",
    videoUrl: "https://www.youtube.com/watch?v=93f_8R_GZ00",
    imageUrl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    prepMinutes: 20, calories: 420, protein: 32, carbs: 45, fat: 12, servings: 3,
    ingredients: [{ name: "chicken", quantity: 1, unit: "lb" }, { name: "honey", quantity: 2, unit: "tbsp" }],
    steps: [{ text: "Stir fry chicken; glaze with honey garlic sauce.", startTime: 25 }]
  },
  {
    name: "Slow Cooker Beef Stew",
    cuisine: "American", diet: "Comfort", mealType: "dinner",
    videoUrl: "https://www.youtube.com/watch?v=68mD8t-7T38",
    imageUrl: "https://images.unsplash.com/photo-1547592116-4197feaf416a?w=800",
    prepMinutes: 20, calories: 500, protein: 42, carbs: 35, fat: 20, servings: 6,
    ingredients: [{ name: "beef chunks", quantity: 2, unit: "lb" }, { name: "potatoes", quantity: 3, unit: "pcs" }],
    steps: [{ text: "Slow cook beef and veggies with broth for 8 hours.", startTime: 20 }]
  }
];

async function sync() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected Successfully.");

    console.log("Syncing Ingredients...");
    const ingredientNames = new Set();
    recipesToSync.forEach(r => r.ingredients.forEach(i => ingredientNames.add(i.name.toLowerCase())));
    
    const existingIngredients = await Ingredient.find({ name: { $in: Array.from(ingredientNames) } });
    const existingMap = new Map(existingIngredients.map(i => [i.name.toLowerCase(), i._id]));

    const newIngs = [];
    for (const name of ingredientNames) {
      if (!existingMap.has(name)) {
        newIngs.push({ name, category: "Other", defaultUnit: "pcs", shelfLifeDays: 7 });
      }
    }
    if (newIngs.length) {
      const created = await Ingredient.insertMany(newIngs);
      created.forEach(i => existingMap.set(i.name.toLowerCase(), i._id));
    }

    console.log("Syncing Recipes...");
    for (const rData of recipesToSync) {
      const ingredients = rData.ingredients.map(ing => ({
        ...ing,
        ingredientId: existingMap.get(ing.name.toLowerCase()) || new mongoose.Types.ObjectId()
      }));

      await Recipe.findOneAndUpdate(
        { name: rData.name },
        { ...rData, ingredients, status: "published" },
        { upsert: true, new: true }
      );
    }

    console.log(`Successfully synced ${recipesToSync.length} recipes.`);
    process.exit(0);
  } catch (err) {
    console.error("Sync Error:", err);
    process.exit(1);
  }
}

sync();
